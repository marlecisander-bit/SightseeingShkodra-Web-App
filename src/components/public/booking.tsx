"use client";
import { clearCheckoutSession, freshBookingSelection } from "@/modules/booking/checkout-browser-state";
import styles from "./booking-dialog.module.css";
import { passengerCount, passengerKeys, passengerLabels, ageLabel, type PassengerCounts } from "@/modules/booking/passengers";

import { Button } from "@/components/ui/button";

import Link from "next/link";
import { activeNavigation } from "@/modules/content/navigation";
import { resolveWebsiteLink, initialWebsiteContent, type WebsiteContent } from "@/modules/content/website-schema";
import { BrandLogo } from "./brand-logo";
import {
  createContext,
  useCallback,
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
  reset: () => void;
  generation: number;
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
  const [generation, setGeneration] = useState(0);
  const reset = useCallback(() => { clearCheckoutSession(); setSelection(freshBookingSelection()); setGeneration(value=>value+1); }, []);
  const dialog = useRef<HTMLDialogElement>(null);
  const [opened, setOpened] = useState(false);
  useEffect(() => {
    if (!opened) return;
    const y = window.scrollY;
    const previous = {position: document.body.style.position, top: document.body.style.top, width: document.body.style.width};
    Object.assign(document.body.style, {position:"fixed", top:`-${y}px`, width:"100%"});
    return () => { Object.assign(document.body.style, previous); window.scrollTo(0,y); };
  }, [opened]);
  const availability = useAvailability(selection.date, selection.guests,selection.passengers,generation);
  return (
    <BookingContext.Provider
      value={{
        selection,
        reset,
        generation,
        setSelection,
        availability,
        open: () => { dialog.current?.showModal(); setOpened(true); },
        close: () => dialog.current?.close(),
      }}
    >
      {children}
      <dialog
        ref={dialog}
        className={`p-booking-dialog ${styles.dialog}`}
        onClose={() => setOpened(false)}
        aria-labelledby="booking-dialog-title"
        onKeyDown={(event) => {
          if (event.key !== "Tab") return;
          const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>(
            "button:not(:disabled), input:not(:disabled), select:not(:disabled), a[href]",
          )).filter(control => control.getClientRects().length > 0);
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
        <BookingDialogContent key={generation} />
      </dialog>
    </BookingContext.Provider>
  );
}

function BookingDialogContent() {
  const {selection, setSelection, availability, close} = useBooking();
  const [step,setStep] = useState(1);
  const heading = useRef<HTMLHeadingElement>(null);
  const scroll = useRef<HTMLDivElement>(null);
  const counts = selection.passengers ?? {adult:selection.guests,child:0,infant:0};
  const selected = availability.quote?.departures.find(d=>d.id===selection.departureId && d.available);
  const price = selected?.passengerQuote;
  let validation = "";
  try { passengerCount(counts); } catch(e) { validation = e instanceof Error ? e.message : "Check your guests."; }
  const ready = Boolean(selected && !availability.loading && !availability.error && !validation);
  function move(next:number) { setStep(next); scroll.current?.scrollTo(0,0); requestAnimationFrame(()=>heading.current?.focus()); }
  const dateText = selection.date ? new Intl.DateTimeFormat("en-GB",{weekday:"short",day:"numeric",month:"short",timeZone:"UTC"}).format(new Date(selection.date+"T12:00:00Z")) : "Select date";
  return <>
    <header className={styles.header}>
      <div><h2 id="booking-dialog-title">Book your day</h2><p>Make room for Shkodra.</p></div>
      <button type="button" className={styles.close} aria-label="Close booking" onClick={close}>×</button>
    </header>
    <div className={styles.progress} aria-live="polite">Step {step} of 3 · {step===1?"When":step===2?"Guests":"Review"}</div>
    <div className={styles.content} ref={scroll}>
      <div className={styles.desktop}><BookingFields /></div>
      <div className={styles.mobile}>
        <h3 ref={heading} tabIndex={-1}>{step===1?"When are you visiting?":step===2?"Who's coming?":"Review your day"}</h3>
        {step===1 && <>
          <label className={styles.date}>
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 2v6m10-6v6M3 11h18"/></svg>
            <span>{dateText}</span>
            <input aria-label="Your date" type="date" value={selection.date} onChange={e=>{const date=e.target.value;setSelection(current=>({...current,date,departureId:""}));}} />
          </label>
          {selection.date && <div className={styles.departures} aria-busy={availability.loading}>
            <h4>Choose departure</h4>
            {availability.loading && <p role="status">Checking departures…</p>}
            <div className={styles.chips}>{availability.quote?.departures.map(d=><button key={d.id} type="button" disabled={!d.available} aria-pressed={d.id===selection.departureId} onClick={()=>setSelection(current=>({...current,departureId:d.id}))}><strong>{d.startTime.slice(0,5)}</strong><span>{!d.available?(d.remaining===0?"Sold out":"Not enough seats"):d.id===selection.departureId?"Selected":`${d.remaining} seats available`}</span></button>)}</div>
            {availability.quote?.departures.length===0 && <NoDepartures />}
          </div>}
        </>}
        {step===2 && <QuantityStepper preserveDeparture />}
        {step===3 && <dl className={styles.review}>
          <div><dt>Your day</dt><dd>{dateText}<br/>{selected?.startTime.slice(0,5) ?? "Choose a departure"} {selected && "departure"}</dd></div>
          <div><dt>Guests</dt><dd>{passengerKeys.filter(k=>counts[k]>0).map(k=><div key={k}>{counts[k]} {passengerLabels[k]}</div>)}</dd></div>
          {price && <div><dt>Total</dt><dd>{displayMoney(price.total,availability.quote!.currency)}</dd></div>}
        </dl>}
        <div className={styles.feedback} role="status">
          {step!==1 && availability.loading && <p>Checking your group and total…</p>}
          {(validation || availability.error) && <p>{validation || availability.error}</p>}
          {step===1 && validation && <button type="button" className="p-text-button" onClick={()=>move(2)}>Check guests</button>}
          {!availability.loading && availability.quote && selection.departureId && !selected && <p>Selected departure is no longer available for your group. <button type="button" className="p-text-button" onClick={()=>move(1)}>Choose another departure</button></p>}
          {availability.error && !validation && <button type="button" className="p-text-button" onClick={availability.refresh}>Try again</button>}
        </div>
      </div>
    </div>
    <footer className={styles.footer}>
      <div className={styles.mobile}>
        {price && !availability.loading && <p className={styles.total}>{displayMoney(price.total,availability.quote!.currency)} total</p>}
        <div className={styles.actions}>
          {step>1 && <button type="button" className="p-button" onClick={()=>move(step-1)}>Back</button>}
          {step<3 ? <button type="button" className="p-button p-button-booking" disabled={!ready} onClick={()=>move(step+1)}>Continue</button> : ready ? <Link className="p-button p-button-booking" href="/book" onClick={close}>Continue to booking</Link> : <button className="p-button p-button-booking" disabled>Continue to booking</button>}
        </div>
      </div>
      <div className={styles.desktop}><Link className="p-button p-button-booking" href="/book" onClick={close}>Review selection</Link></div>
      <p className={styles.note}>No seats held yet. Payment is at the meeting point.</p>
    </footer>
  </>;
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
export function QuantityStepper({ preserveDeparture = false }: { preserveDeparture?: boolean }) {
 const {selection,setSelection,availability}=useBooking();const counts=selection.passengers??{adult:selection.guests,child:0,infant:0};
 function change(k:keyof PassengerCounts,n:number){const passengers={...counts,[k]:n};setSelection({...selection,passengers,guests:passengerKeys.reduce((sum,key)=>sum+passengers[key],0),departureId:preserveDeparture?selection.departureId:""});}
 return <div className="p-passengers">{passengerKeys.map(k=><div key={k}><span>{passengerLabels[k]} {availability.categories&&<small>{ageLabel(availability.categories[k])}</small>}</span><div className="p-stepper" role="group" aria-label={passengerLabels[k]}><button type="button" disabled={counts[k]===0 || (k==="adult" && counts.adult===1 && (counts.child>0 || counts.infant>0))} aria-label={"Remove one "+k} onClick={()=>change(k,counts[k]-1)}>-</button><output aria-live="polite">{counts[k]}</output><button type="button" disabled={selection.guests>=100 || (k!=="adult" && counts.adult===0)} aria-label={"Add one "+k} onClick={()=>change(k,counts[k]+1)}>+</button></div></div>)}</div>;
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
function NoDepartures() {
 const {selection,setSelection,availability}=useBooking();const q=availability.quote;
 return <div><p>{q?.businessDate===selection.date?"No more departures available for today.":"No bookable departures on this date."} Booking closes 15 minutes before departure.</p>{q?.nextOperationalDate&&<button type="button" className="p-text-button" onClick={()=>setSelection({...selection,date:q.nextOperationalDate!,departureId:""})}>Next operational date: {q.nextOperationalDate}</button>}</div>;
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
            <NoDepartures />
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
        className={`p-mobile-actions ${scrolled && pathname !== "/book" && !pathname.startsWith("/booking/manage") && pathname !== "/live" ? "is-visible" : ""}`}
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
  const {generation} = useBooking();
  return <CheckoutFlow key={generation} />;
}
