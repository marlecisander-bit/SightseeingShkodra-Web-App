'use client';
import {createContext,useCallback,useContext,useState,type ReactNode, type ComponentProps} from 'react';
import type {JourneySnapshot} from '@/modules/tracking/journey-contract';
import type {LiveJourneyTracker as Tracker} from './live-journey-tracker';
import {LiveJourneyTracker} from './live-journey-tracker';
import {LiveMapEmbed} from './live-map-embed';
const Context=createContext<{journey:JourneySnapshot|null;stale:boolean;receive:(snapshot:JourneySnapshot|null,reason?:'stale'|'loading')=>void}|null>(null);
export function HomepageJourneyProvider({children,enabled=true}:{children:ReactNode;enabled?:boolean}){
 const [state,setState]=useState<{journey:JourneySnapshot|null;stale:boolean}>({journey:null,stale:false});
 const receive=useCallback((journey:JourneySnapshot|null,reason?:'stale'|'loading')=>setState({journey,stale:reason==='stale'}),[]);
 return <Context.Provider value={{...state,receive}}>{children}{enabled&&<LiveMapEmbed priority background onJourney={receive}/>}</Context.Provider>;
}
export function useHomepageJourney(){return useContext(Context);}
export function HomepageJourney(props:ComponentProps<typeof Tracker>){
 const live=useHomepageJourney();
 return <LiveJourneyTracker {...props} cards showStatus journey={live?.journey} stale={live?.stale}/>;
}
