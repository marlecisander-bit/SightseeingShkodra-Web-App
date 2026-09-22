"use client";

import Link from "next/link";
import { BrandLogo } from "./brand-logo";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type Dispatch,
  type SetStateAction,
} from "react";
import { usePathname } from "next/navigation";
import {
  experience,
  type BookingSelection,
} from "@/modules/public-preview/contracts";
import { Field } from "./ui";
import { useAvailability, displayMoney } from "./use-availability";

type BookingContextValue = {
  selection: BookingSelection;
  setSelection: Dispatch<SetStateAction<BookingSelection>>;
  open: () => void;
  close: () => void;
  availability: ReturnType<typeof useAvailability>;
};
const BookingContext = createContext<BookingContextValue | null>(null);
export function useBooking() {
  const value = useContext(BookingContext);
  if (!value) throw new Error("BookingProvider is required");
  return value;
}
export function BookingProvider({ children }: { children: ReactNode }) {
  const [selection, setSelection] = useState<BookingSelection>({
    date: "",
    guests: 1,
    departureId: "",
  });
  const dialog = useRef<HTMLDialogElement>(null);
  const availability = useAvailability(selection.date, selection.guests);
  return (
    <BookingContext.Provider
      value={{
        selection,
        setSelection,
        availability,
        open: () => dialog.current?.showModal(),
        close: () => dialog.current?.close(),
      }}
    >
      {children}
      <dialog
        ref={dialog}
        className="p-booking-dialog"
        aria-labelledby="booking-dialog-title"
        onKeyDown={(event) => {
          if (event.key !== "Tab") return;
          const controls = event.currentTarget.querySelectorAll<HTMLElement>(
            "button:not(:disabled), input, select, a[href]",
          );
          const first = controls[0];
          const last = controls[controls.length - 1];
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last?.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first?.focus();
          }
        }}
      >
        <div className="p-dialog-top">
          <p className="p-eyebrow">Your day starts here</p>
          <button
            className="p-icon-button"
            aria-label="Close booking"
            onClick={() => dialog.current?.close()}
          >
            ×
          </button>
        </div>
        <h2 id="booking-dialog-title">Make room for Shkodra.</h2>
        <p>Check live availability. No reservation or payment will be made.</p>
        <BookingFields />
        <Link
          className="p-button"
          href="/book"
          onClick={() => dialog.current?.close()}
        >
          Review selection <span aria-hidden="true">→</span>
        </Link>
      </dialog>
    </BookingContext.Provider>
  );
}
export function BookButton({
  children = "Book your day",
  className = "",
}: {
  children?: ReactNode;
  className?: string;
}) {
  const { open } = useBooking();
  return (
    <button className={`p-button ${className}`} onClick={open}>
      {children}
      <span aria-hidden="true">↗</span>
    </button>
  );
}
export function QuantityStepper() {
  const { selection, setSelection, availability } = useBooking();
  return (
    <div className="p-stepper" role="group" aria-label="Guests">
      <button
        type="button"
        aria-label="Remove one guest"
        disabled={selection.guests <= 1}
        onClick={() => {
          availability.refresh();
          setSelection({
            ...selection,
            guests: selection.guests - 1,
            departureId: "",
          });
        }}
      >
        −
      </button>
      <output aria-live="polite">
        {selection.guests} {selection.guests === 1 ? "guest" : "guests"}
      </output>
      <button
        type="button"
        aria-label="Add one guest"
        disabled={selection.guests >= 2147483647}
        onClick={() => {
          availability.refresh();
          setSelection({
            ...selection,
            guests: selection.guests + 1,
            departureId: "",
          });
        }}
      >
        +
      </button>
    </div>
  );
}
export function BookingFields() {
  const { selection, setSelection, availability } = useBooking();
  const departures = availability.quote?.departures ?? [];
  const selected = departures.find(
    (d) => d.id === selection.departureId && d.available,
  );
  function updateDate(date: string) {
    if (date !== selection.date) availability.refresh();
    setSelection((current) =>
      current.date === date ? current : { ...current, date, departureId: "" },
    );
  }
  return (
    <div className="p-booking-fields">
      <Field label="Your date">
        <input
          type="date"
          value={selection.date}
          onChange={(e) => updateDate(e.target.value)}
          onInput={(e) => {
            const date = e.currentTarget.value;
            updateDate(date);
          }}
          onBlur={(e) => {
            const date = e.currentTarget.value;
            updateDate(date);
          }}
        />
      </Field>
      <div className="p-field">
        <span>Who&apos;s coming?</span>
        <QuantityStepper />
      </div>
      <Field label="Departure">
        <select
          value={selected?.id ?? ""}
          disabled={!availability.quote || departures.length === 0}
          onChange={(e) =>
            setSelection({ ...selection, departureId: e.target.value })
          }
        >
          <option value="">Choose a departure</option>
          {departures.map((departure) => (
            <option
              key={departure.id}
              value={departure.id}
              disabled={!departure.available}
            >
              {departure.startTime.slice(0, 5)}
              {departure.available
                ? ` · ${departure.remaining} seats left`
                : " · Unavailable for your group"}
            </option>
          ))}
        </select>
      </Field>
      <AvailabilityStatus />
    </div>
  );
}
export function AvailabilityStatus() {
  const { selection, availability } = useBooking();
  const quote = availability.quote;
  return (
    <div className="p-availability-status" role="status" aria-live="polite">
      {!selection.date ? (
        <p>Choose a date to check departures and prices.</p>
      ) : availability.loading ? (
        <p>Checking availability…</p>
      ) : availability.error ? (
        <p>{availability.error}</p>
      ) : quote ? (
        <>
          <p>
            <strong>Total: {displayMoney(quote.total, quote.currency)}</strong>{" "}
            for {quote.guests} {quote.guests === 1 ? "guest" : "guests"}. Local
            time: {availability.timezone}.
          </p>
          {quote.departures.length === 0 ? (
            <p>No upcoming departures for this date. Try another day.</p>
          ) : !quote.departures.some((d) => d.available) ? (
            <p>
              No departure has enough seats for your group. Try another date or
              guest count.
            </p>
          ) : null}
          {selection.departureId &&
            !quote.departures.some(
              (d) => d.id === selection.departureId && d.available,
            ) && (
              <p>
                Your previous departure is no longer available. Please choose
                again.
              </p>
            )}
          <p>Availability refreshes automatically. No seats are held.</p>
        </>
      ) : null}
      {selection.date && (
        <button
          type="button"
          className="p-text-button"
          onClick={availability.refresh}
          disabled={availability.loading}
        >
          Refresh availability
        </button>
      )}
    </div>
  );
}
export function BookingBar({
  facts = experience,
}: {
  facts?: { price: string; frequency: string };
}) {
  const { selection } = useBooking();
  return (
    <div className="p-booking-bar" id="booking">
      <BookingFields />
      <BookButton>Plan your day</BookButton>
      <p>
        {selection.date
          ? "Selection only. No seats reserved or payment taken."
          : `Booking opens soon. ${facts.price}. ${facts.frequency}.`}
      </p>
    </div>
  );
}
export function Header() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menu, setMenu] = useState(false);
  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 80);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);
  return (
    <>
      <header
        className={`p-header ${pathname !== "/" || scrolled || menu ? "p-header-solid" : ""}`}
      >
        <Link className="p-wordmark" href="/" onClick={() => setMenu(false)}>
          <BrandLogo light={pathname === "/" && !scrolled && !menu} />
        </Link>
        <button
          className="p-menu-toggle"
          aria-expanded={menu}
          aria-controls="public-navigation"
          onClick={() => setMenu(!menu)}
        >
          {menu ? "Close" : "Menu"}
        </button>
        <nav
          id="public-navigation"
          className={menu ? "p-navigation is-open" : "p-navigation"}
          aria-label="Main navigation"
        >
          <Link href="/tour" onClick={() => setMenu(false)}>
            Tour
          </Link>
          <Link href="/#route" onClick={() => setMenu(false)}>
            Route
          </Link>
          <Link href="/explore" onClick={() => setMenu(false)}>
            Explore Shkodra
          </Link>
          <Link href="/live" onClick={() => setMenu(false)}>
            Live map
          </Link>
          <Link href="/tour#faq" onClick={() => setMenu(false)}>
            FAQ
          </Link>
          <span className="p-language" title="More languages coming soon">
            EN
          </span>
        </nav>
        <BookButton className="p-header-book">Book now</BookButton>
      </header>
      <div
        className={`p-mobile-actions ${scrolled && pathname !== "/book" ? "is-visible" : ""}`}
      >
        <Link href="/live">
          <span aria-hidden="true">◎</span> Live van
        </Link>
        <BookButton>Book your day</BookButton>
      </div>
    </>
  );
}
export function BookingFlow() {
  const { selection, availability } = useBooking();
  const quote = availability.quote;
  const selected = quote?.departures.find(
    (d) => d.id === selection.departureId && d.available,
  );
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const heading = useRef<HTMLHeadingElement>(null);
  function go(next: number) {
    setStep(next);
    requestAnimationFrame(() => {
      heading.current?.focus({ preventScroll: true });
      heading.current?.scrollIntoView({ block: "center" });
    });
  }
  return (
    <div className="p-flow">
      <ol className="p-progress" aria-label="Booking progress">
        {["Selection", "Details", "Payment"].map((label, i) => (
          <li key={label} aria-current={step === i ? "step" : undefined}>
            <span>{i + 1}</span>
            {label}
          </li>
        ))}
      </ol>
      <h2 ref={heading} tabIndex={-1}>
        {["Choose your day.", "Make it your day.", "One last step."][step]}
      </h2>
      <p className="p-preview">
        Booking preview · No seats reserved. Do not enter real personal or
        payment details.
      </p>
      <div className="p-flow-summary">
        <span>{selection.date || "Date not selected"}</span>
        <span>
          {selection.guests} {selection.guests === 1 ? "guest" : "guests"}
        </span>
        <span>
          {selected
            ? `${selected.startTime.slice(0, 5)} · ${availability.timezone}`
            : "Choose an available departure"}
        </span>
        <strong>
          Total:{" "}
          {quote ? displayMoney(quote.total, quote.currency) : "not available"}
        </strong>
      </div>
      {step === 0 ? (
        <>
          <BookingFields />
          <button
            className="p-button"
            disabled={!selected}
            onClick={() => go(1)}
          >
            Continue to details →
          </button>
        </>
      ) : step === 1 ? (
        <>
          <AvailabilityStatus />
          {!selected && (
            <p role="alert">
              Return to selection and choose an available departure before
              continuing.
            </p>
          )}
          <Field label="Preview guest name (fictional only)">
            <input
              autoComplete="off"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Alex Example"
            />
          </Field>
          <p>Your entries stay in this preview tab and are not submitted.</p>
          <button
            className="p-button"
            disabled={!selected}
            onClick={() => go(2)}
          >
            Continue to payment preview →
          </button>
        </>
      ) : (
        <>
          <div className="p-empty">
            <h3>Payments are not open yet.</h3>
            <p>
              A confirmed price and secure payment options will appear here when
              booking opens.
            </p>
            <button className="p-button" disabled>
              Payment unavailable
            </button>
          </div>
          <Link className="p-text-link" href="/your-day">
            View the sample ticket screen →
          </Link>
        </>
      )}
      {step > 0 && (
        <button className="p-text-button" onClick={() => go(step - 1)}>
          ← Back to {step === 1 ? "selection" : "details"}
        </button>
      )}
    </div>
  );
}
