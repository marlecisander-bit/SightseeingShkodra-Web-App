"use client";
import { lowestQuotedFare } from "./booking-presentation";

import { clearCheckoutSession, freshBookingSelection } from "@/modules/booking/checkout-browser-state";
import styles from "./booking-dialog.module.css";
import { passengerKeys, type PassengerCounts } from "@/modules/booking/passengers";

import { Button } from "@/components/ui/button";

import Link from "next/link";
import { activeNavigation } from "@/modules/content/navigation";
import { homepageVisible, resolveWebsiteLink, initialWebsiteContent, type WebsiteContent } from "@/modules/content/website-schema";
import { BrandLogo } from "./brand-logo";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type ComponentProps,
  type Dispatch,
  type SetStateAction,
} from "react";
import { usePathname } from "next/navigation";
import {
  type BookingSelection,
} from "@/modules/public-preview/contracts";
import { BookingPriceBreakdown, BookingDateSelector, PassengerSelector, DepartureSelector, BookingPriceIndicator } from "./booking-controls";
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
        open: () => {
          if (!dialog.current || dialog.current.open) return;
          dialog.current.showModal();
          setOpened(true);
        },
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
        {opened && <BookingDialogContent key={generation} />}
      </dialog>
    </BookingContext.Provider>
  );
}

function BookingDialogContent() {
  const {close}=useBooking();
  const closeButton = useRef<HTMLButtonElement>(null);
  useEffect(() => { closeButton.current?.focus(); }, []);
  return <><header className={styles.header}><div><BrandLogo light/><h2 id="booking-dialog-title">Book your day</h2></div><button ref={closeButton} type="button" className={styles.close} aria-label="Close booking" onClick={close}>&times;</button></header><div className={styles.content}><CheckoutFlow /></div></>;
}

/** Keep link styling and direct/new-tab access; ordinary booking activation opens the shared dialog. */
export function PublicBookingLink({ href, onClick, ...props }: ComponentProps<typeof Link>) {
  const { open } = useBooking();
  const booking = href === "/book";
  return <Link {...props} href={href} aria-haspopup={booking ? "dialog" : props["aria-haspopup"]} onClick={event => {
    onClick?.(event);
    if (!booking || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || (props.target && props.target !== "_self") || props.download) return;
    event.preventDefault();
    // Transfer from the timetable dialog instead of stacking two modal surfaces.
    event.currentTarget.closest<HTMLDialogElement>("dialog[open]")?.close();
    open();
  }} />;
}

export function BookButton({
  children = "Book your day",
  className = "",
  onClick,
}: {
  children?: ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  const { open } = useBooking();
  return (
    <Button type="button" size="lg" aria-haspopup="dialog" className={`p-button p-button-booking ${className}`} onClick={() => { onClick?.(); open(); }}>
      {children}
    </Button>
  );
}
export function QuantityStepper({ preserveDeparture = false }: { preserveDeparture?: boolean }) {
 const {selection,setSelection,availability}=useBooking();const counts=selection.passengers??{adult:selection.guests,child:0,infant:0};
 function change(k:keyof PassengerCounts,n:number){const passengers={...counts,[k]:n};setSelection({...selection,passengers,guests:passengerKeys.reduce((sum,key)=>sum+passengers[key],0),departureId:preserveDeparture?selection.departureId:""});}
 return <PassengerSelector counts={counts} categories={availability.categories} onChange={change} canRemove={k=>!(counts[k]===0 || (k==="adult" && counts.adult===1 && (counts.child>0 || counts.infant>0)))} canAdd={k=>!(selection.guests>=100 || (k!=="adult" && counts.adult===0))}/>;
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
      <div className="p-booking-party"><BookingDateSelector value={selection.date} onChange={updateDate}/><QuantityStepper preserveDeparture /></div>
      <DepartureSelector departures={departures} value={selected?.id??""} loading={availability.loading} onChange={departureId=>setSelection({...selection,departureId})}/>
      <AvailabilityStatus />
    </div>
  );
}
function NoDepartures() {
 const {selection,setSelection,availability}=useBooking();const q=availability.quote;
 return <div><p>{q?.businessDate===selection.date?"No more departures available for today.":"No bookable departures on this date. Choose another day."} Booking closes 15 minutes before departure.</p><button type="button" className="p-text-button" onClick={event=>event.currentTarget.closest(".p-flow")?.querySelector<HTMLInputElement>('input[type="date"]')?.focus()}>Choose another date</button>{q?.nextOperationalDate&&<button type="button" className="p-text-button" onClick={()=>setSelection({...selection,date:q.nextOperationalDate!,departureId:""})}>Next operational date: {q.nextOperationalDate}</button>}</div>;
}
export function AvailabilityStatus() {
  const { selection, availability } = useBooking();
  const quote = availability.quote;
  const adultPrices=quote?.departures.filter(d=>d.available).flatMap(d=>d.passengerQuote?.lines.filter(l=>l.category==="adult"&&l.quantity===1).map(l=>l.unitPrice)??[])??[];
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
          {!price && quote.guests===1 && adultPrices.length>0 && <BookingPriceIndicator amount={lowestQuotedFare(adultPrices)} date={selection.date}/>}
          <p>
            <strong>{price?`Total: ${displayMoney(price.total,quote.currency)}`:"Select a departure to see your total"}</strong>{" "}
            for {quote.guests} {quote.guests === 1 ? "guest" : "guests"}. Times shown in local Shkodra time.
          </p>
          {price&&<BookingPriceBreakdown snapshot={price}/>}
          {quote.departures.length === 0 ? (
            <NoDepartures />
          ) : !quote.departures.some((d) => d.available) ? (
            <p>
              {quote.departures.every(departure=>departure.remaining===0)?"Departures on this date are sold out. Choose another date.":"No departure has enough seats for your group. Choose another date or change your guest count."}
            </p>
          ) : null}
          {selection.departureId &&
            !quote.departures.some(
              (d) => d.id === selection.departureId && d.available,
            ) && (
              <p>
                Your selected departure no longer has enough seats or is no longer bookable. Please choose another departure.
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
export function BookingBar() {
  const { selection } = useBooking();
  return (
    <div className="p-booking-bar" id="booking">
      <BookingFields />
      <BookButton>Book your day</BookButton>
      <p>
        {selection.date
          ? "Selection only. No seats reserved or payment taken."
          : "Choose your date and departure. Pay at the meeting point."}
      </p>
    </div>
  );
}
export function Header({ content: c = initialWebsiteContent }: { content?: WebsiteContent }) {
  const pathname = usePathname();
  const inBooking = pathname === "/book" || pathname.startsWith("/booking/");
  const [heroVisible, setHeroVisible] = useState(true);
  const [hash, setHash] = useState("");
  const headerRef = useRef<HTMLElement>(null);
  const scrolled = pathname !== "/" || !heroVisible;
  const links = ["/", ...[0,1,2,3,4].map(i=>resolveWebsiteLink(c[`nav.${i}.link`]))];
  const active = activeNavigation(pathname,hash,links);
  const [menu, setMenu] = useState(false);
  const menuToggle = useRef<HTMLButtonElement>(null);
  const returnHome = useRef(false);
  useEffect(() => {
    if (pathname === "/" && returnHome.current) {
      returnHome.current = false;
      window.scrollTo({ top: 0, behavior: "instant" });
    }
  }, [pathname]);
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
        className={`p-header ${pathname === "/" ? "p-header-home" : ""} ${pathname !== "/" || !homepageVisible(c, "hero") || scrolled || menu ? "p-header-solid" : ""}`}
        onKeyDown={(event) => {
          if (event.key === "Escape" && menu) {
            setMenu(false);
            menuToggle.current?.focus();
          }
        }}
      >
        <Link className="p-wordmark" href="/" scroll aria-label="Go to Sightseeing Shkodra homepage" onClick={(event) => {
          if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
          setMenu(false);
          if (pathname === "/") {
            event.preventDefault();
            window.history.replaceState(window.history.state, "", "/");
            setHash("");
            window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
          } else returnHome.current = true;
        }}>
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
          {links.map((href,i)=><PublicBookingLink key={i} href={href} aria-current={active===i ? (href.includes("#") ? "location" : "page") : undefined} onClick={()=>{setMenu(false);setHash(href.includes("#")?"#"+href.split("#")[1]:"");}}>{i===0?c["nav.home"]:c[`nav.${i-1}.label`]}</PublicBookingLink>)}
          <span className="p-language" title="More languages coming soon">
            EN
          </span>
        </nav>
        {inBooking ? <Link className="p-header-back" href="/">Back to website</Link> : <BookButton className="p-header-book" onClick={() => setMenu(false)}>{c["nav.book"]}</BookButton>}
      </header>

    </>
  );
}
export function BookingFlow() {
  const {generation} = useBooking();
  return <CheckoutFlow key={generation} />;
}
