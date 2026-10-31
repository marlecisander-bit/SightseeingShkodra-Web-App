
'use client';
import {sightseeingStops,type StopPlace} from '@/modules/content/sightseeing-stops';
import {StopSelector} from './stop-selector';
/** Shared editorial selectors; no tracking subscriptions or separate content store. */
export function HomepageStopsGallery({stops,places,learnLabel='Explore destination'}:{stops:readonly {id:string;label:string}[];places:readonly StopPlace[];learnLabel?:string}){
 return <StopSelector items={sightseeingStops(stops,places)} learnLabel={learnLabel}/>;
}
