"use client";
import type {BookableProduct} from "@/modules/booking/products";
import { analyticsSessionIdentity, trackBookingEvent } from "@/modules/analytics/browser";
import type {MeetingPoint} from "@/modules/booking/meeting-point";
import {MeetingPointSummary} from "./meeting-point-summary";
import { lowestQuotedFare } from "./booking-presentation";

import { clearCheckoutSession, freshBookingSelection } from "@/modules/booking/checkout-browser-state";
import styles from "./booking-dialog.module.css";
import { passengerKeys, type PassengerCounts } from "@/modules/booking/passengers";

import { Button } from "@/components/ui/button";

import Link from "next/link";
import { activeNavigation, publicNavigation } from "@/modules/content/navigation";
import { visibleWebsiteLink, homepageVisible, initialWebsiteContent, type WebsiteContent } from "@/modules/content/website-schema";
import { BrandLogo } from "./brand-logo";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
  type ComponentProps,
  type MouseEvent as ReactMouseEvent,
  type Dispatch,
  type SetStateAction,
} from "react";
import { usePathname } from "next/navigation";
import {
  type BookingSelection,
} from "@/modules/public-preview/contracts";
import { BookingPriceBreakdown, BookingDateSelector, PassengerSelector, DepartureSelector, BookingPriceIndicator } from "./booking-controls";
import dynamic from "next/dynamic";
import {MobileBookingDate} from './mobile-booking-date';
import { useAvailability, displayMoney } from "./use-availability";

const CheckoutFlow = dynamic(
  () => import("./checkout-flow").then((module) => module.CheckoutFlow),
  { loading: () => <p role="status">Loading your booking selection...</p> },
);

type BookingContextValue = {
  content: WebsiteContent;
  product?: BookableProduct;
  currentMeetingPoint?:MeetingPoint|null;
  selection: BookingSelection;
  setSelection: Dispatch<SetStateAction<BookingSelection>>;
  open: (trigger?: HTMLElement) => void;
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
export function BookingProvider({ children, content: suppliedContent, preview = false, currentMeetingPoint, product }: { children: ReactNode; content?: WebsiteContent; preview?:boolean;currentMeetingPoint?:MeetingPoint|null; product?:BookableProduct }) {
  const parent=useContext(BookingContext);
  const content=suppliedContent??parent?.content??initialWebsiteContent;
  const [selection, setSelection] = useState<BookingSelection>({
    productId: product?.id,
    date: "",
    guests: 1,
    departureId: "",
  });
  const [generation, setGeneration] = useState(0);
  const reset = useCallback(() => { clearCheckoutSession(product?.primary?undefined:product?.id); setSelection({...freshBookingSelection(),productId:product?.id}); setGeneration(value=>value+1); }, [product?.id,product?.primary]);
  const dialogTitle=useId();
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const [opened, setOpened] = useState(false);
  const [confirmClose,setConfirmClose] = useState(false);
  const [dialogBusy,setDialogBusy] = useState(false);
  const [closeNotice,setCloseNotice] = useState("");
  const dialogState = useRef({dirty:false,busy:false});
  const beforeClosePrompt = useRef<HTMLElement|null>(null);
  const requestCloseRef = useRef<() => void>(()=>{});
  const historyMarker = "ssBookingDialog";
  const reportDialogState = useCallback((value:{dirty:boolean;busy:boolean})=>{
    dialogState.current=value;
    setDialogBusy(value.busy);
    if(!value.busy)setCloseNotice("");
  },[]);
  const finishClose = () => {setConfirmClose(false);dialog.current?.close();};
  const requestClose = () => {
    if(dialogState.current.busy){setCloseNotice("Please wait for the current booking request to finish before closing.");return;}
    if(dialogState.current.dirty){
      if(!confirmClose)beforeClosePrompt.current=document.activeElement instanceof HTMLElement?document.activeElement:null;
      setConfirmClose(true);return;
    }
    finishClose();
  };
  useEffect(()=>{requestCloseRef.current=requestClose;});
  useEffect(()=>{
    if(!opened)return;
    const back=()=>{
      if(!dialog.current?.open || window.history.state?.[historyMarker]===dialogTitle)return;
      // Back first removes only the same-URL dialog entry. Restore it while a
      // discard decision or an in-flight mutation still needs this surface.
      if(dialogState.current.dirty||dialogState.current.busy)window.history.pushState({...window.history.state,[historyMarker]:dialogTitle},"");
      requestCloseRef.current();
    };
    window.addEventListener("popstate",back);
    return()=>window.removeEventListener("popstate",back);
  },[opened,dialogTitle]);
  useEffect(()=>()=>{
    if(window.history.state?.[historyMarker]===dialogTitle){
      const state={...window.history.state};delete state[historyMarker];window.history.replaceState(state,"");
    }
  },[dialogTitle]);
  useEffect(() => {
    if (!opened) return;
    const y = window.scrollY;
    // Preserve the current border-box; the root gutter is already accounted for.
    const width = document.body.getBoundingClientRect().width;
    const previous = {position: document.body.style.position, top: document.body.style.top, width: document.body.style.width};
    Object.assign(document.body.style, {position:"fixed", top:`-${y}px`, width:`${width}px`});
    return () => { Object.assign(document.body.style, previous); window.scrollTo(0,y); };
  }, [opened]);
  useEffect(() => {
    const viewport = window.visualViewport;
    const node = dialog.current;
    if (!opened || !viewport || !node) return;
    const fit = () => {
      node.style.setProperty("--booking-viewport-height", `${viewport.height}px`);
      node.style.setProperty("--booking-viewport-top", `${viewport.offsetTop}px`);
      node.style.setProperty("--booking-viewport-width", `${viewport.width}px`);
      node.style.setProperty("--booking-viewport-left", `${viewport.offsetLeft}px`);
    };
    fit();
    viewport.addEventListener("resize", fit);
    viewport.addEventListener("scroll", fit);
    return () => {
      viewport.removeEventListener("resize", fit);
      viewport.removeEventListener("scroll", fit);
      node.style.removeProperty("--booking-viewport-height");
      node.style.removeProperty("--booking-viewport-top");
      node.style.removeProperty("--booking-viewport-width");
      node.style.removeProperty("--booking-viewport-left");
    };
  }, [opened]);
  const availability = useAvailability(preview?'':selection.date, selection.guests,selection.passengers,generation,product?.id);
  return (
    <BookingContext.Provider
      value={{
        selection,
        content,
        product,
        currentMeetingPoint:currentMeetingPoint===undefined?parent?.currentMeetingPoint:currentMeetingPoint,
        reset,
        generation,
        setSelection,
        availability,
        open: (trigger) => {
          if (product?.active===false || !dialog.current || dialog.current.open) return;
          opener.current = trigger ?? (document.activeElement instanceof HTMLElement ? document.activeElement : null);
          const state={...window.history.state,[historyMarker]:dialogTitle};
          if(window.history.state?.[historyMarker])window.history.replaceState(state,"");
          else window.history.pushState(state,"");
          dialog.current.showModal();
          if(!preview)trackBookingEvent('begin_checkout', 'checkout:' + analyticsSessionIdentity());
          setOpened(true);
        },
        close: requestClose,
      }}
    >
      {children}
      <dialog
        ref={dialog}
        className={`p-booking-dialog ${styles.dialog}`}
        onClose={() => {
          setOpened(false);setConfirmClose(false);setCloseNotice("");
          if(window.history.state?.[historyMarker]===dialogTitle)window.history.back();
          opener.current?.focus({preventScroll:true});
        }}
        onCancel={event=>{
          event.preventDefault();
          if(confirmClose){setConfirmClose(false);requestAnimationFrame(()=>beforeClosePrompt.current?.focus({preventScroll:true}));}
          else requestClose();
        }}
        aria-labelledby={opened?dialogTitle:undefined}
        aria-label={opened?undefined:product?`Book ${product.title}`:"Booking"}
        onKeyDown={(event) => {
          if (event.key !== "Tab") return;
          const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>(
            "button:not(:disabled), input:not(:disabled), select:not(:disabled), a[href]",
          )).filter(control => control.getClientRects().length > 0 && !control.closest("[inert], [hidden]"));
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
        {opened && <BookingDialogContent titleId={dialogTitle} key={generation} content={content} preview={preview} busy={dialogBusy} confirmClose={confirmClose} closeNotice={closeNotice} onStateChange={reportDialogState} onDiscard={finishClose} onKeep={()=>{setConfirmClose(false);requestAnimationFrame(()=>beforeClosePrompt.current?.focus({preventScroll:true}));}} />}
      </dialog>
    </BookingContext.Provider>
  );
}

const subscribeMobileBooking=(notify:()=>void)=>{if(typeof window.matchMedia!=='function')return()=>{};const media=window.matchMedia('(max-width:767px)');media.addEventListener('change',notify);return()=>media.removeEventListener('change',notify);};
function BookingDialogContent({content,preview=false,titleId,busy,confirmClose,closeNotice,onStateChange,onKeep,onDiscard}: {
  titleId:string;content:WebsiteContent;preview?:boolean;busy:boolean;confirmClose:boolean;closeNotice:string;
  onStateChange:(value:{dirty:boolean;busy:boolean})=>void;onKeep:()=>void;onDiscard:()=>void;
}) {
  const {close,currentMeetingPoint}=useBooking();
  const mobile=useSyncExternalStore(subscribeMobileBooking,()=>typeof window.matchMedia==='function'&&window.matchMedia('(max-width:767px)').matches,()=>false);
  const closeButton = useRef<HTMLButtonElement>(null);
  const keepButton = useRef<HTMLButtonElement>(null);
  const confirmTitle=useId(),confirmDescription=useId();
  useEffect(() => { closeButton.current?.focus(); }, []);
  useEffect(()=>{if(confirmClose)keepButton.current?.focus();},[confirmClose]);
  return <>
    <header className={styles.header}><div><BrandLogo light/><h2 id={titleId}>{mobile?"Book your experience":content["bookingDialog.title"]}</h2></div><button ref={closeButton} type="button" className={styles.close} aria-label="Close booking" disabled={busy||confirmClose} onClick={close}>&times;</button></header>
    {closeNotice&&<p className={styles.closeNotice} role="status">{closeNotice}</p>}
    {confirmClose&&<section className={styles.discard} role="alertdialog" aria-modal="true" aria-labelledby={confirmTitle} aria-describedby={confirmDescription}>
      <h3 id={confirmTitle}>Close booking?</h3><p id={confirmDescription}>Your entered contact details will be cleared. Your selected date, departure and passengers will be kept. Closing does not cancel a confirmed booking.</p>
      <div><button ref={keepButton} type="button" className="p-button p-button-booking" onClick={onKeep}>Keep editing</button><button type="button" className="p-text-button" onClick={onDiscard}>Close and clear details</button></div>
    </section>}
    <div className={styles.content} hidden={confirmClose}><p>{content["bookingDialog.text"]}</p><div data-booking-intro-meeting><MeetingPointSummary value={currentMeetingPoint}/></div>{preview?<p>Saved editorial preview. Booking actions are unavailable here.</p>:<CheckoutFlow mobileDialog={mobile} onDialogStateChange={onStateChange}/>}</div>
    <div data-booking-footer className={styles.footer} hidden={confirmClose}/>
  </>;
}

/** Keep link styling and direct/new-tab access; ordinary booking activation opens the shared dialog. */
export function PublicBookingLink({ href, onClick, ...props }: ComponentProps<typeof Link>) {
  const { open,product } = useBooking();
  const booking = href === "/book";
  if(booking&&product?.active===false)return <span className={props.className} aria-disabled="true">Booking unavailable</span>;
  return <Link {...props} className={`${props.className ?? ""}${booking && props.className?.includes("p-button") ? " p-button-booking" : ""}`} href={href} aria-haspopup={booking ? "dialog" : props["aria-haspopup"]} onClick={event => {
    onClick?.(event);
    if (!booking || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || (props.target && props.target !== "_self") || props.download) return;
    event.preventDefault();
    // Transfer from the timetable dialog instead of stacking two modal surfaces.
    event.currentTarget.closest<HTMLDialogElement>("dialog[open]")?.close();
    open(event.currentTarget);
  }} />;
}

export function BookButton({
  children = "Book your day",
  className = "",
  ariaLabel,
  onClick,
}: {
  children?: ReactNode;
  className?: string;
  ariaLabel?: string;
  onClick?: () => void;
}) {
  const { open,product } = useBooking();
  return (
    <Button type="button" size="lg" disabled={product?.active===false} aria-haspopup="dialog" aria-label={product?.active===false?"Booking unavailable":ariaLabel} className={`p-button p-button-booking ${className}`} onClick={(event) => { onClick?.(); open(event.currentTarget); }}>
      {children}
    </Button>
  );
}
export function QuantityStepper({ preserveDeparture = false,showPrices=false }: { preserveDeparture?: boolean;showPrices?:boolean }) {
 const {selection,setSelection,availability}=useBooking();const counts=selection.passengers??{adult:selection.guests,child:0,infant:0};
 function change(k:keyof PassengerCounts,n:number){const passengers={...counts,[k]:n};setSelection({...selection,passengers,guests:passengerKeys.reduce((sum,key)=>sum+passengers[key],0),departureId:preserveDeparture?selection.departureId:""});}
 const quote=availability.quote?.departures.find(d=>d.id===selection.departureId)?.passengerQuote;
 return <PassengerSelector showPrices={showPrices} priceLines={quote?.lines} currency={quote?.currency} counts={counts} categories={availability.categories} onChange={change} canRemove={k=>!(counts[k]===0 || (k==="adult" && counts.adult===1 && (counts.child>0 || counts.infant>0)))} canAdd={k=>!(selection.guests>=100 || (k!=="adult" && counts.adult===0))}/>;
}
export function BookingFields({ stage = "all", mobileDialog=false }: { stage?: "all" | "when" | "who";mobileDialog?:boolean }) {
  const { selection, setSelection, availability } = useBooking();
  const departures = availability.quote?.departures ?? [];
  const selected = departures.find(
    (d) => d.id === selection.departureId && d.available,
  );
  function updateDate(date: string,checked=false) {
    if (date !== selection.date&&!checked) availability.refresh();
    setSelection((current) =>
      current.date === date ? current : { ...current, date, departureId: "" },
    );
  }
  return (
    <div className="p-booking-fields">
      <div className="p-booking-party">{stage !== "who" && <>{mobileDialog?<MobileBookingDate value={selection.date} onChange={updateDate} quote={availability.quote} checkDate={availability.checkDate}/>:<BookingDateSelector value={selection.date} onChange={updateDate}/>}</>} {stage !== "when" && <QuantityStepper preserveDeparture showPrices={mobileDialog}/>}</div>
      {stage !== "who" && <DepartureSelector showPrices={mobileDialog} currency={availability.quote?.currency} departures={departures} value={selected?.id??""} loading={availability.loading} onChange={departureId=>setSelection({...selection,departureId})}/> }
      <AvailabilityStatus compact={mobileDialog}/>
    </div>
  );
}
function NoDepartures() {
 const {selection,setSelection,availability}=useBooking();const q=availability.quote;
 return <div><p>{q?.businessDate===selection.date?"No more departures available for today.":"No bookable departures on this date. Choose another day."} Booking closes 15 minutes before departure.</p><button type="button" className="p-text-button" onClick={event=>event.currentTarget.closest(".p-flow")?.querySelector<HTMLElement>('input[type="date"], [aria-label="Choose booking date"] button')?.focus()}>Choose another date</button>{q?.nextOperationalDate&&<button type="button" className="p-text-button" onClick={()=>setSelection({...selection,date:q.nextOperationalDate!,departureId:""})}>Next operational date: {q.nextOperationalDate}</button>}</div>;
}
export function AvailabilityStatus({compact=false}:{compact?:boolean}={}) {
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
          {!compact && !price && quote.guests===1 && adultPrices.length>0 && <BookingPriceIndicator amount={lowestQuotedFare(adultPrices)} date={selection.date}/>}
          {!compact&&<p>
            <strong>{price?`Total: ${displayMoney(price.total,quote.currency)}`:"Select a departure to see your total"}</strong>{" "}
            for {quote.guests} {quote.guests === 1 ? "guest" : "guests"}. Times shown in local Shkodra time.
          </p>}
          {!compact&&price&&<BookingPriceBreakdown snapshot={price}/>}
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
          {!compact&&<p>Availability refreshes automatically. No seats are held.</p>}
        </>
      ) : null}
      {selection.date && (!compact||availability.error) && (
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
export function Header({ content: c = initialWebsiteContent, previewPathname }: { content?: WebsiteContent; previewPathname?:string }) {
  const currentPathname = usePathname();
  const pathname = previewPathname ?? currentPathname;
  const inBooking = pathname === "/book" || pathname.startsWith("/booking/");
  const [heroVisible, setHeroVisible] = useState(true);
  const { open,product } = useBooking();
  const [hash, setHash] = useState("");
  const headerRef = useRef<HTMLElement>(null);
  const [mobileHeadlineCovered,setMobileHeadlineCovered]=useState(false);
  const scrolled = pathname !== "/" || !heroVisible || mobileHeadlineCovered;
  const items = publicNavigation(c);
  const links = items.map(item=>item.href);
  const active = activeNavigation(pathname,hash,links);
  const [menu, setMenu] = useState(false);
  const menuToggle = useRef<HTMLButtonElement>(null);
  const navigation = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!menu) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    navigation.current?.querySelector<HTMLAnchorElement>("a")?.focus();
    const desktop = window.matchMedia("(min-width:1101px)");
    const closeOnDesktop = () => { if (desktop.matches) setMenu(false); };
    desktop.addEventListener("change", closeOnDesktop);
    return () => {
      document.body.style.overflow = previousOverflow;
      desktop.removeEventListener("change", closeOnDesktop);
    };
  }, [menu]);
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
    const hero = pathname === '/' ? document.getElementById('home-hero') : null;

    let observer: IntersectionObserver | undefined;
    let headerResize: ResizeObserver | undefined;
    if(pathname === '/' && hero){
      let measuredHeight = -1;
      const observeHero = () => {
        const headerHeight=headerRef.current?.getBoundingClientRect().height??76;
        if (headerHeight === measuredHeight) return;
        measuredHeight = headerHeight;
        observer?.disconnect();
        observer=new IntersectionObserver(entries=>{
          for(const entry of entries){
            if(entry.target===hero)setHeroVisible(entry.isIntersecting && entry.intersectionRatio > 0.2);

          }
        },{rootMargin:'-'+headerHeight+'px 0px 0px 0px',threshold:[0,0.2]});
        observer.observe(hero);

      };
      observeHero();
      // Breakpoints and safe areas can change the fixed header's actual height.
      headerResize = new ResizeObserver(observeHero);
      if (headerRef.current) headerResize.observe(headerRef.current);
    }
    return ()=>{observer?.disconnect();headerResize?.disconnect();window.removeEventListener('hashchange',updateHash);window.removeEventListener('popstate',updateHash);};
  }, [pathname]);
  useEffect(() => {
    const hero = pathname === '/' ? document.getElementById('home-hero') : null;
    const header = headerRef.current;
    if (!hero || !header) return;
    let frame = 0;
    const measure = () => {
      frame = 0;
      const height = header.getBoundingClientRect().height;
      hero.style.setProperty('--hero-header-offset', `${height}px`);
      const heading = hero.querySelector('h1');
      setMobileHeadlineCovered(window.matchMedia('(max-width:900px)').matches && !!heading && heading.getBoundingClientRect().top < height);
    };
    const queue = () => { if (!frame) frame = requestAnimationFrame(measure); };
    const resize = new ResizeObserver(queue);
    resize.observe(header);
    window.addEventListener('scroll',queue,{passive:true});
    window.addEventListener('resize',queue);
    measure();
    return () => { resize.disconnect();cancelAnimationFrame(frame);window.removeEventListener('scroll',queue);window.removeEventListener('resize',queue); };
  },[pathname]);
  const bookFromHeader = (event: ReactMouseEvent<HTMLButtonElement>) => {
    setMenu(false);
    const experiences=pathname==='/'?document.getElementById('experiences'):null;
    if(experiences){experiences.scrollIntoView({behavior:'smooth',block:'start'});return;}
    open(window.matchMedia("(max-width:1100px)").matches ? menuToggle.current ?? event.currentTarget : event.currentTarget);
  };
  return (
    <>
      <header ref={headerRef}
        className={`p-header ${pathname === "/" ? "p-header-home" : ""} ${pathname !== "/" || !homepageVisible(c, "hero") || scrolled || menu ? "p-header-solid" : ""}`}
        onKeyDown={(event) => {
          if (event.key === "Tab" && menu) {
            const controls = Array.from(headerRef.current?.querySelectorAll<HTMLElement>('a, button') ?? []).filter(node => node.getClientRects().length && getComputedStyle(node).visibility !== "hidden");
            const first = controls[0], last = controls[controls.length - 1];
            if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
            else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
          }
          if (event.key === "Escape" && menu) {
            setMenu(false);
            menuToggle.current?.focus();
          }
        }}
      >
        <div className="p-header-inner">
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

        <nav
          ref={navigation}
          id="public-navigation"
          className={menu ? "p-navigation is-open" : "p-navigation"}
          aria-label="Main navigation"
        >
          {links.map((href,i)=>visibleWebsiteLink(href,c) ? <PublicBookingLink key={i} href={href} aria-current={active===i ? (href.includes("#") ? "location" : "page") : undefined} onClick={()=>{if(menu)menuToggle.current?.focus();setMenu(false);setHash(href.includes("#")?"#"+href.split("#")[1]:"");}}><span className="p-nav-label">{items[i].label}</span></PublicBookingLink> : null)}
          {inBooking ? <Link className="p-menu-back" href="/" onClick={() => setMenu(false)}>Back to website</Link> : <Button type="button" size="lg" className="p-button p-button-booking p-menu-book" disabled={pathname!=="/"&&product?.active===false} onClick={bookFromHeader}>{c["nav.book"]}</Button>}
        </nav>
        <span className="p-language" title="More languages coming soon" aria-label="English; more languages coming soon">EN</span>
        {inBooking ? <Link className="p-header-back" href="/">Back to website</Link> : <Button type="button" size="lg" className="p-button p-button-booking p-header-book" disabled={pathname!=="/"&&product?.active===false} aria-label={c["nav.book"]} onClick={bookFromHeader}><span className="p-header-book-full">{c["nav.book"]}</span><span className="p-header-book-compact" aria-hidden="true">Book</span></Button>}
        <button
          ref={menuToggle}
          className="p-menu-toggle"
          aria-expanded={menu}
          aria-controls="public-navigation"
          aria-label={menu ? "Close menu" : "Open menu"}
          onClick={() => setMenu(!menu)}
        >
          <span aria-hidden="true">{menu ? "×" : "☰"}</span>
        </button>
        </div>
      </header>
      {menu && <button type="button" className="p-menu-backdrop" tabIndex={-1} aria-label="Close navigation backdrop" onClick={() => { setMenu(false); menuToggle.current?.focus(); }} />}
    </>
  );
}
export function BookingFlow({productHeading=true}: {productHeading?:boolean} = {}) {
  const {generation,currentMeetingPoint,product} = useBooking();
  const footer = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;
    const fit = () => {
      if (footer.current) footer.current.style.bottom = `${Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop)}px`;
    };
    fit();
    viewport.addEventListener("resize", fit);
    viewport.addEventListener("scroll", fit);
    return () => { viewport.removeEventListener("resize", fit); viewport.removeEventListener("scroll", fit); };
  }, []);
  if(product?.active===false)return <p role="status">Unavailable for booking · {product.unavailableMessage||"Temporarily unavailable"}</p>;
  return <><MeetingPointSummary value={currentMeetingPoint}/><CheckoutFlow key={generation} productHeading={productHeading} /><div ref={footer} data-booking-page-footer/></>;
}
