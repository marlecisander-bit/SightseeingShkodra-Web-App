import {notFound} from 'next/navigation';
import {connection} from 'next/server';
import {WhatsAppFixture} from './preview';
import '../../(public)/public.css';
export default async function Page(){await connection();if(process.env.NODE_ENV!=='development')notFound();return <WhatsAppFixture/>;}
