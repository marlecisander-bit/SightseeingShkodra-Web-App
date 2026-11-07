import {notFound} from 'next/navigation';
import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {StopsReview} from './review';
import type {StopPlace} from '@/modules/content/sightseeing-stops';
import '../../(public)/public.css';
export default async function Page(){
 if(process.env.NODE_ENV!=='development')notFound();
 const data=JSON.parse(await readFile(join(process.cwd(),'docs/evidence/stops-simplification-20261031/public-stops.json'),'utf8')) as {id:string;name:string;image:string;alt:string;text:string;link:string}[];
 const stops=data.map(s=>({id:s.id,label:s.name}));
 const places:StopPlace[]=data.map(s=>({...s,id:'review-'+s.id,stopId:s.id}));
 return <StopsReview stops={stops} places={places}/>;
}
