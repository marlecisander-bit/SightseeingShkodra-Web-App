"use client";
import { checkoutStorageKey } from "@/modules/booking/checkout-browser-state";
import { passengerLabels } from "@/modules/booking/passengers";

import { BookingPassCard } from "./booking-pass";
import { Button } from "@/components/ui/button";
import { useEffect, useRef, useState } from "react";
import { BookingFields, useBooking } from "./booking";
import { Field } from "./ui";
import { displayMoney } from "./use-availability";
import type { Hold, PendingOrder } from "@/modules/booking/contracts";
import type { BookingSelection } from "@/modules/public-preview/contracts";

type Attempt = {
  requestId: string;
  selection: BookingSelection;
  time: string;
  total: number;
  hold?: Hold;
};
const storageKey = checkoutStorageKey;
async function send(body: object) {
  const response = await fetch("/api/public/checkout", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(20000),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error ?? "UNAVAILABLE");
  return result;
}
const messages: Record<string, string> = {
  RESERVATION_CONFIRMED:
    "These seats are already confirmed. Check your reservation below; staff can help with cancellation.",
  ADULT_REQUIRED:"At least one adult is required when booking for children or infants.",
  SOLD_OUT:
    "Those seats are no longer available. Please choose another departure.",
  HOLD_INACTIVE:
    "Your reserved time has ended. Please choose your seats again.",
  NOT_FOUND: "This reservation is no longer available in this browser.",
  NOT_PUBLISHED: "This tour is not available for booking yet.",
  INVALID_REQUEST: "Please check your details and try again.",
  CONFLICT:
    "This request was already submitted with different details. Keep your original details when retrying.",
  SESSION_REQUIRED: "Your booking session has ended. Please start again.",
};
export function CheckoutFlow() {
  const { selection, setSelection, availability, reset } = useBooking();
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [order, setOrder] = useState<PendingOrder | null>(null);
  const [customer, setCustomer] = useState({ name: "", email: "", phone: "" });
  const [submitted, setSubmitted] = useState<typeof customer | null>(null);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [error, setError] = useState("");
  const [remaining, setRemaining] = useState(0);
  const [restoring, setRestoring] = useState(true);
  const deadline = useRef(0);
  const heading = useRef<HTMLHeadingElement>(null);
  function save(value: Attempt | null) {
    setAttempt(value);
    try {
      if (value) sessionStorage.setItem(storageKey, JSON.stringify(value));
      else sessionStorage.removeItem(storageKey);
    } catch {
      /* In-memory checkout still works. */
    }
  }
  function updateHold(
    value: Attempt,
    hold: Hold,
    serverNow: string,
    now: number,
  ) {
    deadline.current =
      now + Math.max(0, Date.parse(hold.expires_at) - Date.parse(serverNow));
    setRemaining(Math.max(0, Math.ceil((deadline.current - now) / 1000)));
    save({ ...value, hold,total:hold.passengerSnapshot?.total??value.total });
  }
  useEffect(() => {
    let live = true;
    Promise.resolve().then(async () => {
      try {
        const saved = JSON.parse(
          sessionStorage.getItem(storageKey) ?? "null",
        ) as Attempt | null;
        if (!saved || !saved.requestId || !saved.selection || !live) return;
        setAttempt(saved);
        setSelection(saved.selection);
        if (saved.hold) {
          const result = await send({ action: "read", holdId: saved.hold.id });
          if (live) {
            if (result.order?.status === "cancelled" || result.order?.bookingStatus === "cancelled") { reset(); return; }
            deadline.current =
              performance.now() +
              Math.max(
                0,
                Date.parse(result.hold.expires_at) -
                  Date.parse(result.serverNow),
              );
            setAttempt({ ...saved, hold: result.hold });
            setOrder(result.order ?? null);
            setRemaining(
              Math.max(
                0,
                Math.ceil((deadline.current - performance.now()) / 1000),
              ),
            );
          }
        }
      } catch {
        if (live)
          setError(
            "We could not restore your reservation. Retry or wait for its reserved time to end.",
          );
      } finally {
        if (live) setRestoring(false);
      }
    });
    return () => {
      live = false;
    };
  }, [setSelection, reset]);
  useEffect(() => {
    const timer = setInterval(
      () =>
        setRemaining(
          Math.max(0, Math.ceil((deadline.current - performance.now()) / 1000)),
        ),
      1000,
    );
    return () => clearInterval(timer);
  }, []);
  async function perform(action: () => Promise<void>) {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setError("");
    try {
      await action();
      requestAnimationFrame(() =>
        heading.current?.focus({ preventScroll: true }),
      );
    } catch (e) {
      if (e instanceof Error && e.message === "HOLD_INACTIVE") {
        deadline.current = 0;
        setRemaining(0);
      }
      if (e instanceof Error && e.message === "INVALID_REQUEST")
        setSubmitted(null);
      setError(
        messages[e instanceof Error ? e.message : ""] ??
          "We could not confirm the result. Retry the same request; your details have been kept.",
      );
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }
  const selected = availability.quote?.departures.find(
    (d) => d.id === selection.departureId && d.available,
  );
  const active = attempt?.hold?.status === "active" && remaining > 0;
  async function reserve() {
    const value =
      attempt ??
      (selected && availability.quote
        ? {
            requestId: crypto.randomUUID(),
            selection: { ...selection },
            time: selected.startTime.slice(0, 5),
            total: selected.passengerQuote?.total??availability.quote.total,
          }
        : null);
    if (!value) return;
    save(value);
    await send({ action: "session" });
    try {
      const result = await send({
        action: "hold",
        date: value.selection.date,
        guests: value.selection.guests,passengers:value.selection.passengers??{adult:value.selection.guests,child:0,infant:0},
        departureId: value.selection.departureId,
        requestId: value.requestId,
      });
      // Called only after the reserve button's awaited request, never during render.
      // eslint-disable-next-line react-hooks/purity
      updateHold(value, result.hold, result.serverNow, performance.now());
    } catch (e) {
      if (
        e instanceof Error &&
        ["SOLD_OUT", "NOT_FOUND", "NOT_PUBLISHED", "INVALID_REQUEST"].includes(
          e.message,
        )
      ) {
        save(null);
        availability.refresh();
      }
      throw e;
    }
  }
  async function restart() {
    if (attempt?.hold) {
      try {
        await send({ action: "release", holdId: attempt.hold.id });
      } catch (e) {
        // An expired/missing capability cannot release a hold; its database TTL
        // still frees capacity. Network uncertainty must retain the retry state.
        if (
          !(e instanceof Error) ||
          !["SESSION_REQUIRED", "NOT_FOUND"].includes(e.message)
        )
          throw e;
      }
    }
    save(null);
    setOrder(null);
    setSubmitted(null);
    setRemaining(0);
    availability.refresh();
  }
  const chosen = attempt?.selection ?? selection;
  if (restoring) return <p role="status">Restoring your selection…</p>;
  return (
    <div className="p-flow">
      <ol className="p-progress" aria-label="Booking progress">
        {["Selection", "Details", "Confirmation"].map((label, i) => (
          <li
            key={label}
            aria-current={
              (order ? 2 : attempt?.hold ? 1 : 0) === i ? "step" : undefined
            }
          >
            <span>{i + 1}</span>
            {label}
          </li>
        ))}
      </ol>
      <h2 ref={heading} tabIndex={-1} className={order ? "p-screen-reader-only" : undefined}>
        {order
          ? order.bookingStatus === "confirmed"
            ? "Your seats are confirmed."
            : order.status === "cancelled"
              ? "Your booking was cancelled."
              : "Your order needs attention."
          : attempt?.hold
            ? "Your seats, for a little while."
            : "Choose your day."}
      </h2>
      {!order && <><p className="p-preview">
        Reserve online and pay at the meeting point.
      </p>
      <div className="p-flow-summary">
        <span>{chosen.date || "Choose a date"}</span>
        <span>{chosen.guests} guests</span>
        <span>
          {attempt?.time ??
            selected?.startTime.slice(0, 5) ??
            "Choose a departure"}
        </span>
        <strong>
          Total:{" "}
          {attempt
              ? displayMoney(attempt.total, "EUR")
              : availability.quote
                ? displayMoney(
                    selected?.passengerQuote?.total??availability.quote.total,
                    availability.quote.currency,
                  )
                : "not available"}
        </strong>
      </div></>}
      {error && <p role="alert">{error}</p>}
      {error && attempt?.hold && (
        <Button
          className="p-text-button"
          disabled={busy}
          onClick={() =>
            void perform(async () => {
              const result = await send({
                action: "read",
                holdId: attempt.hold!.id,
              });
              updateHold(
                attempt,
                result.hold,
                result.serverNow,
                performance.now(),
              );
              setOrder(result.order ?? null);
            })
          }
        >
          Retry reservation check
        </Button>
      )}
      {attempt?.hold ? (
        <>
          {!order && (
            <p role="timer" aria-label="Time remaining">
              {active
                ? `Seats reserved for ${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, "0")}`
                : "Your reserved time has ended. No seats are secured."}
            </p>
          )}
          {attempt.hold.passengerSnapshot&&<div aria-label="Your tickets">{attempt.hold.passengerSnapshot.lines.map(l=><p key={l.category}>{l.quantity} {passengerLabels[l.category]}  |  {displayMoney(l.unitPrice,"EUR")} = {displayMoney(l.total,"EUR")}</p>)}<strong>Total: {displayMoney(attempt.hold.passengerSnapshot.total,"EUR")}</strong></div>}
          {order ? (
            <><BookingPassCard order={order}/>{order.status === "cancelled" && <Button className="p-button p-button-booking" onClick={reset}>Book Again</Button>}</>
          ) : active ? (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                void perform(async () => {
                  const details = submitted ?? { ...customer };
                  setSubmitted(details);
                  const result = await send({
                    action: "order",
                    holdId: attempt.hold!.id,
                    customer: details,
                  });
                  setOrder(result.order);
                });
              }}
            >
              <Field label="Full name">
                <input
                  required
                  maxLength={200}
                  autoComplete="name"
                  value={customer.name}
                  disabled={busy || Boolean(submitted)}
                  onChange={(e) =>
                    setCustomer({ ...customer, name: e.target.value })
                  }
                />
              </Field>
              <Field label="Email">
                <input
                  type="email"
                  required
                  maxLength={254}
                  autoComplete="email"
                  value={customer.email}
                  disabled={busy || Boolean(submitted)}
                  onChange={(e) =>
                    setCustomer({ ...customer, email: e.target.value })
                  }
                />
              </Field>
              <Field label="Phone (optional)">
                <input
                  type="tel"
                  maxLength={50}
                  autoComplete="tel"
                  value={customer.phone}
                  disabled={busy || Boolean(submitted)}
                  onChange={(e) =>
                    setCustomer({ ...customer, phone: e.target.value })
                  }
                />
              </Field>
              <p>
                Confirm your reservation below. The final price is checked by
                the booking system. You will pay at the meeting point.
              </p>
              <Button className="p-button p-button-booking" disabled={busy || !active}>
                {busy
                  ? "Saving…"
                  : submitted
                    ? "Retry confirming reservation"
                    : "Confirm reservation - pay at meeting point"}
              </Button>
            </form>
          ) : null}
          {!order && (
            <Button
              className="p-text-button"
              disabled={busy}
              onClick={() => void perform(restart)}
            >
              Release seats and return to selection
            </Button>
          )}
        </>
      ) : (
        <>
          {!attempt && <BookingFields />}
          <Button
            className="p-button p-button-booking"
            disabled={busy || (!attempt && !selected)}
            onClick={() => void perform(reserve)}
          >
            {busy
              ? "Reserving seats…"
              : attempt
                ? "Retry reserving these seats"
                : "Reserve seats and continue"}
          </Button>
          {attempt && (
            <p>
              We are keeping this request unchanged until its result is
              confirmed, so retrying will not reserve twice.
            </p>
          )}
        </>
      )}
    </div>
  );
}
