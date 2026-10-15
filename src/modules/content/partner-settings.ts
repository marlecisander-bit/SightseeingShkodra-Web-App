import { safeSocialUrl, safeWebsiteLink } from './website-links';
export const partnerDefaults = {
 'partners.eyebrow':'STRONGER TOGETHER', 'partners.title':'Our Partners',
 'partners.description':'We connect with local businesses, tourism organizations and cultural institutions to help visitors experience the best of Shkodra.',
 'partners.showOnHomepage':'true', 'partners.ctaEnabled':'false', 'partners.ctaLabel':'Discover more about Shkodra →', 'partners.ctaUrl':'',
};
export function safePartnerDestination(value:string) { return !!value && (safeWebsiteLink(value) || safeSocialUrl(value)); }
