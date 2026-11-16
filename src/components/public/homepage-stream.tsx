import {Suspense, type ReactNode} from 'react';
import type {WebsiteContent} from '@/modules/content/website-schema';
import {preloadHomepageHero} from './homepage-hero-images';

/** Flush existing, media-matched hints without waiting for below-fold data. */
export function HomepageStream({content,children}:{content:WebsiteContent;children:ReactNode}) {
  preloadHomepageHero(content);
  return <Suspense fallback={<main id="main-content" className="p-home" aria-busy="true"><section id="home-hero" style={{minHeight:'100svh',background:'#12191c'}}><p className="p-screen-reader-only" role="status">Loading sightseeing tours…</p></section></main>}>{children}</Suspense>;
}
