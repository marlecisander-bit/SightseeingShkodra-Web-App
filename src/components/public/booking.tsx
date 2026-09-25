"use client";
import { passengerKeys, passengerLabels, ageLabel, type PassengerCounts } from "@/modules/booking/passengers";

import { Button, ButtonContent } from "@/components/ui/button";

import Link from "next/link";
import { activeNavigation } from "@/modules/content/navigation";
import { resolveWebsiteLink, initialWebsiteContent, type WebsiteContent } from "@/modules/content/website-schema";
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
import dynamic from "next/dynamic";
import { useAvailability, displayMoney } from "./use-availability";

const CheckoutFlow = dynamic(
  () => import("./checkout-flow").then((module) => module.CheckoutFlow),
  { loading: () => <p role="status">Loading your booking selection...</p> },
);

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
  const availability = useAvailability(selection.date, selection.guests,selection.passengers);
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
            "button:not(:disabled), input:not(:disabled), select:not(:disabled), a[href]",
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
          className="p-button p-button-booking"
          href="/book"
          onClick={() => dialog.current?.close()}
        >
          <ButtonContent>Review selection</ButtonContent>
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
    <Button type="button" size="lg" className={`p-button p-button-booking ${className}`} onClick={open}>
      {children}
    </Button>
  );
}
export function QuantityStepper() {
 const {selection,setSelection,availability}=useBooking();const counts=selection.passengers??{adult:selection.guests,child:0,infant:0};
 function change(k:keyof PassengerCounts,n:number){const passengers={...counts,[k]:n};setSelection({...selection,passengers,guests:passengerKeys.reduce((sum,key)=>sum+passengers[key],0),departureId:""});}
 return <div className="p-passengers">{passengerKeys.map(k=><div key={k}><span>{passengerLabels[k]} {availability.categories&&<small>{ageLabel(availability.categories[k])}</small>}</span><div className="p-stepper" role="group" aria-label={passengerLabels[k]}><button type="button" disabled={counts[k]===0} aria-label={"Remove one "+k} onClick={()=>change(k,counts[k]-1)}>-</button><output aria-live="polite">{counts[k]}</output><button type="button" disabled={selection.guests>=100} aria-label={"Add one "+k} onClick={()=>change(k,counts[k]+1)}>+</button></div></div>)}</div>;
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
  const price=quote?.departures.find(d=>d.id===selection.departureId)?.passengerQuote;
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
            <strong>{price?`Total: ${displayMoney(price.total,quote.currency)}`:"Select a departure to see your total"}</strong>{" "}
            for {quote.guests} {quote.guests === 1 ? "guest" : "guests"}. Local
            time: {availability.timezone}.
          </p>
          {price&&<div>{price.lines.map(line=><p key={line.category}>{line.quantity} {passengerLabels[line.category]}  |  {displayMoney(line.unitPrice,"EUR")} = {displayMoney(line.total,"EUR")}{line.offer?.label&&`  |  ${line.offer.label}`}</p>)}</div>}
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
export function Header({ content: c = initialWebsiteContent }: { content?: WebsiteContent }) {
  const pathname = usePathname();
  const [heroVisible, setHeroVisible] = useState(true);
  const [hash, setHash] = useState("");
  const headerRef = useRef<HTMLElement>(null);
  const scrolled = pathname !== "/" || !heroVisible;
  const links = ["/", ...[0,1,2,3,4].map(i=>resolveWebsiteLink(c[`nav.${i}.link`]))];
  const active = activeNavigation(pathname,hash,links);
  const [menu, setMenu] = useState(false);
  const menuToggle = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const updateHash = () => setHash(window.location.hash);
    updateHash();window.addEventListener('hashchange',updateHash);window.addEventListener('popstate',updateHash);
    const hero = document.getElementById('home-hero');
    let observer: IntersectionObserver | undefined;
    if(pathname === '/' && hero){
      const headerHeight=headerRef.current?.getBoundingClientRect().height??76;
      observer=new IntersectionObserver(([entry])=>setHeroVisible(entry.isIntersecting && entry.intersectionRatio > 0.2),{rootMargin:'-'+headerHeight+'px 0px 0px 0px',threshold:[0,0.2]});observer.observe(hero);
    }
    return ()=>{observer?.disconnect();window.removeEventListener('hashchange',updateHash);window.removeEventListener('popstate',updateHash);};
  }, [pathname]);
  return (
    <>
      <header ref={headerRef}
        className={`p-header ${pathname === "/" ? "p-header-home" : ""} ${pathname !== "/" || scrolled || menu ? "p-header-solid" : ""}`}
        onKeyDown={(event) => {
          if (event.key === "Escape" && menu) {
            setMenu(false);
            menuToggle.current?.focus();
          }
        }}
      >
        <Link className="p-wordmark" href="/" onClick={() => setMenu(false)}>
          <BrandLogo light />
        </Link>
        <button
          ref={menuToggle}
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
          {links.map((href,i)=><Link key={i} href={href} aria-current={active===i ? (href.includes("#") ? "location" : "page") : undefined} onClick={()=>{setMenu(false);setHash(href.includes("#")?"#"+href.split("#")[1]:"");}}>{i===0?c["nav.home"]:c[`nav.${i-1}.label`]}</Link>)}
          <span className="p-language" title="More languages coming soon">
            EN
          </span>
        </nav>
        <BookButton className="p-header-book">{c["nav.book"]}</BookButton>
      </header>
      <div
        className={`p-mobile-actions ${scrolled && pathname !== "/book" ? "is-visible" : ""}`}
      >
        <Link href="/live">
          {c["nav.mobileMap"]}
        </Link>
        <BookButton>{c["nav.mobileBook"]}</BookButton>
      </div>
    </>
  );
}
export function BookingFlow() {
  return <CheckoutFlow />;
}
