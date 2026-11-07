import {notFound} from 'next/navigation';
import {connection} from 'next/server';
import {AlertFixture} from './preview';
export default async function Page(){await connection();if(process.env.NODE_ENV!=='development')notFound();return <AlertFixture/>;}
