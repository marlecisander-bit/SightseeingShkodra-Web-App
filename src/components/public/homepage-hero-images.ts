import {getImageProps} from 'next/image';
import {preload} from 'react-dom';
import type {WebsiteContent} from '@/modules/content/website-schema';

export function homepageHeroImages(content: WebsiteContent) {
  const common = {alt:content['hero.alt'], sizes:'100vw', quality:75};
  return {
    desktop:getImageProps({...common,src:content['hero.desktop'],width:1920,height:1080}).props,
    mobile:getImageProps({...common,src:content['hero.mobile']||content['hero.desktop'],width:900,height:1200}).props,
  };
}

// Register resource hints before the remaining homepage data reads finish.
// Exactly one media query matches; picture and preload share responsive candidates.
export function preloadHomepageHero(content: WebsiteContent) {
  const {desktop,mobile} = homepageHeroImages(content);
  for (const [image,media] of [[mobile,'(max-width:599px)'],[desktop,'(min-width:600px)']] as const) {
    preload(image.src,{as:'image',imageSrcSet:image.srcSet,imageSizes:image.sizes,media});
  }
}
