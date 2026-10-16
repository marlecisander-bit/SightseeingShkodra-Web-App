import {notFound} from 'next/navigation';
import {connection} from 'next/server';
import {Harness} from './harness';
import '../(public)/public.css';
export const metadata={title:'Synthetic Package 1 acceptance',robots:{index:false,follow:false}};
export default async function Page(){
 await connection();
 if(process.env.VERCEL_ENV!=='preview'||Object.entries(process.env).some(([key,value])=>value&&/^(NEXT_PUBLIC_SUPABASE_|SUPABASE_|POSTGRES_|CHECKOUT_SESSION_SECRET$|RESEND_API_KEY$|CRON_SECRET$|VAPID_PRIVATE_KEY$)/.test(key)))notFound();
 return <Harness/>;
}
