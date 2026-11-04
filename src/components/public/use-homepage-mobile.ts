'use client';
import {useSyncExternalStore} from 'react';
const query='(max-width: 759px)';
const subscribe=(notify:()=>void)=>{const media=window.matchMedia(query);media.addEventListener('change',notify);return()=>media.removeEventListener('change',notify);};
/** Neutral during SSR; this breakpoint controls presentation, never journey acquisition. */
export function useHomepageMobile(){return useSyncExternalStore(subscribe,()=>window.matchMedia(query).matches,()=>null);}
