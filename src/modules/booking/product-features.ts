import {amenityIcons,type AmenityIconName} from '@/modules/content/hero-amenities';
export const productFeatureOptions=[
 {key:'multilingual_audio_guide',label:'Multilingual audioguide',icon:'languages'},
 {key:'two_hours_ticket',label:'2-hour ticket',icon:'clock'},
 {key:'full_day_ticket',label:'Full-day ticket',icon:'ticket'},
 {key:'air_conditioning',label:'Air conditioned',icon:'snowflake'},
 {key:'live_tracking',label:'Live tracking',icon:'map'},
 {key:'hop_on_hop_off',label:'Hop on hop off',icon:'van'},
 {key:'audio_guide',label:'Audio guide',icon:'headphones'},
 {key:'live_guide',label:'Live guide',icon:'people'},
 {key:'wifi',label:'Wi-Fi',icon:'wifi'},
 {key:'walking',label:'Walking included',icon:'pin'},
 {key:'van_tour',label:'Van tour',icon:'van'},
] as const satisfies readonly {key:string;label:string;icon:AmenityIconName}[];
export type ProductFeatureKey=typeof productFeatureOptions[number]['key'];
export type ProductFeatureIcons=Partial<Record<ProductFeatureKey,AmenityIconName>>;
export function productFeatureBadges(card?:{features?:ProductFeatureKey[];feature_icons?:ProductFeatureIcons}){
 return productFeatureOptions.filter(f=>card?.features?.includes(f.key)).map(f=>{const chosen=card?.feature_icons?.[f.key];return {...f,icon:chosen&&amenityIcons.includes(chosen)?chosen:f.icon};});
}
