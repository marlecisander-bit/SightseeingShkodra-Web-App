'use client';
import {useRef} from 'react';
import {BookingProvider,BookButton} from '@/components/public/booking';
import {initialWebsiteContent} from '@/modules/content/website-schema';
import {Button} from '@/components/ui/button';
import cancelStyles from '@/components/public/booking-controls.module.css';
import galleryStyles from '@/components/public/homepage-stops-gallery.module.css';
export function ResponsiveControls(){
 const cancel=useRef<HTMLDialogElement>(null),planner=useRef<HTMLDialogElement>(null),gallery=useRef<HTMLDialogElement>(null);
 const fields=<div style={{display:'grid',gap:16,minWidth:0}}><label className={cancelStyles.date}>Departure date<input type="date" defaultValue="2030-11-01"/></label><label className={cancelStyles.date}>Departure time<input type="time" defaultValue="11:00"/></label><label className="p-field">Booking option with a long translated label<select defaultValue="full"><option value="full">Full-day sightseeing ticket for the entire family</option></select></label><p>Layout fixture only. No bookings, tracking, payments or communications.</p></div>;
 return <div className="public-site"><main className="p-container p-section"><h1>Responsive control review</h1><p>Development-only synthetic content. Forms do not submit.</p><BookingProvider preview content={{...initialWebsiteContent,'bookingDialog.title':'Choose your sightseeing experience and booking options'}}><BookButton>Open actual booking dialog (editorial preview)</BookButton></BookingProvider><div className="p-actions" style={{display:'flex',gap:12,marginBlock:20}}><Button className="p-button" onClick={()=>cancel.current?.showModal()}>Review cancellation dialog layout</Button><Button className="p-button" onClick={()=>planner.current?.showModal()}>Review timetable dialog</Button><Button className="p-button" onClick={()=>gallery.current?.showModal()}>Review destination dialog</Button></div>
 <dialog ref={cancel} className={cancelStyles.cancel} aria-label="Cancellation layout fixture"><h2>Cancel this illustrative family sightseeing reservation?</h2>{fields}<div><Button className="p-button" onClick={()=>cancel.current?.close()}>Keep my booking and return to my reservation</Button><Button className="p-button" onClick={()=>cancel.current?.close()}>Confirm this synthetic cancellation</Button></div></dialog>
 <dialog ref={planner} className="p-planner-dialog" aria-label="Timetable layout fixture"><h2>Timetable and boarding details</h2>{fields}<Button className="p-button" onClick={()=>planner.current?.close()}>Close timetable and continue browsing</Button></dialog>
 <dialog ref={gallery} className={galleryStyles.detail} aria-label="Destination layout fixture"><button className={galleryStyles.close} onClick={()=>gallery.current?.close()}>Close destination details</button><h3>A destination with a longer translated place name</h3><p>Illustrative destination details to review text wrapping and keyboard focus on narrow screens.</p><Button className="p-button" onClick={()=>gallery.current?.close()}>Back to the sightseeing route and live map</Button></dialog>
 </main></div>;
}
