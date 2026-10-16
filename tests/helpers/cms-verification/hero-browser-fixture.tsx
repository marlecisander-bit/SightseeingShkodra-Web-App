import {HomepageHero} from '@/components/public/homepage-hero';
import {BookingProvider} from '@/components/public/booking';
import {initialWebsiteContent} from '@/modules/content/website-schema';
import '../../../src/app/(public)/public.css';
/** Synthetic local composition; never exported from application routing. */
export default function HeroBrowserFixture(){return <div className="public-site"><BookingProvider content={initialWebsiteContent} preview><HomepageHero content={initialWebsiteContent} productTitle="Synthetic day ticket" stopCount={5} fare={{amount:0,currency:'EUR',date:'2030-06-01'}}/></BookingProvider></div>;}
