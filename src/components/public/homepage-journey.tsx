'use client';
import {createContext,useCallback,useContext,useState,type ReactNode, type ComponentProps} from 'react';
import type {JourneySnapshot} from '@/modules/tracking/journey-contract';
import {LiveJourneyTracker} from './live-journey-tracker';
const Context=createContext<{journey:JourneySnapshot|null;stale:boolean;receive:(snapshot:JourneySnapshot|null,reason?:'stale'|'loading')=>void}|null>(null);
export function HomepageJourneyProvider({children}:{children:ReactNode}){
 const [state,setState]=useState<{journey:JourneySnapshot|null;stale:boolean}>({journey:null,stale:false});
 const receive=useCallback((journey:JourneySnapshot|null,reason?:'stale'|'loading')=>setState({journey,stale:reason==='stale'}),[]);
 return <Context.Provider value={{...state,receive}}>{children}</Context.Provider>;
}
export function useHomepageJourney(){return useContext(Context);}
export function HomepageJourney(props:ComponentProps<typeof LiveJourneyTracker>){
 const live=useHomepageJourney();
 return <LiveJourneyTracker {...props} journey={live?.journey} stale={live?.stale}/>;
}
