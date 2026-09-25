import "../../(public)/public.css";
import { notFound } from 'next/navigation';
import { GuestReviews } from '@/components/public/guest-reviews';
import { defaultReviewSettings } from '@/modules/content/reviews';
export default function ReviewsPreview(){
 if(process.env.NODE_ENV!=='development')notFound();
 const reviews=Array.from({length:3},(_,i)=>({id:`layout-${i}`,author:`Layout test ${i+1} (not a guest)`,rating:5-i,body:i===0?'Layout verification text. This is synthetic QA content, not a guest review. '.repeat(20):'Layout verification only. No customer review is represented by this test card.',source:'Other',review_date:'2026-09-24',original_url:null,avatar_url:null,language:'en',featured:false,display_order:i,published:false,updated_at:''}));
 return <main className="public-site"><p style={{textAlign:'center'}}>Development layout test only. These are not guest reviews and are never published.</p><GuestReviews selection={{reviews,settings:defaultReviewSettings}}/></main>;
}
