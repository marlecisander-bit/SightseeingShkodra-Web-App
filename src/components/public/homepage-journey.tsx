'use client';
import {createContext,useCallback,useContext,useState,type ReactNode, type ComponentProps} from 'react';
import type {JourneySnapshot} from '@/modules/tracking/journey-contract';
import type {LiveJourneyTracker as Tracker} from './live-journey-tracker';
import dynamic from 'next/dynamic';
import {HomepageStopsGallery} from './homepage-stops-gallery';
import {useHomepageMobile} from './use-homepage-mobile';
const LiveJourneyTracker=dynamic(()=>import('./live-journey-tracker').then(m=>m.LiveJourneyTracker));
const Context=createContext<{journey:JourneySnapshot|null;stale:boolean;receive:(snapshot:JourneySnapshot|null,reason?:'stale'|'loading')=>void}|null>(null);
export function HomepageJourneyProvider({children}:{children:ReactNode}){
 const [state,setState]=useState<{journey:JourneySnapshot|null;stale:boolean}>({journey:null,stale:false});
 const receive=useCallback((journey:JourneySnapshot|null,reason?:'stale'|'loading')=>setState({journey,stale:reason==='stale'}),[]);
 return <Context.Provider value={{...state,receive}}>{children}</Context.Provider>;
}
export function useHomepageJourney(){return useContext(Context);}
export function HomepageJourney(props:ComponentProps<typeof Tracker>){
 const live=useHomepageJourney();
 const mobile=useHomepageMobile();
 if(mobile!==false)return <HomepageStopsGallery stops={props.stops} places={props.places} learnLabel={props.learnLabel}/>;
 return <LiveJourneyTracker {...props} journey={live?.journey} stale={live?.stale}/>;
}
