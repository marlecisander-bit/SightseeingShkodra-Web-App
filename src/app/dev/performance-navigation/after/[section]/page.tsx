import {notFound} from 'next/navigation';
export default async function Page({params}:{params:Promise<{section:string}>}){if(process.env.NODE_ENV!=='development')notFound();const {section}=await params;return <h1>{section}</h1>;}
