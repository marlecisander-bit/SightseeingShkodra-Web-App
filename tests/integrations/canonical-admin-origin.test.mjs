import {test} from 'node:test';
import assert from 'node:assert/strict';
import {adminSiteOrigin,canonicalAdminOrigin,canonicalAdminRedirect} from '../../src/modules/identity/admin-origin.ts';
import {recoveryRedirect} from '../../src/modules/identity/password-recovery.ts';
const prod={NODE_ENV:'production',APP_ENV:'production',VERCEL_ENV:'production',NEXT_PUBLIC_SITE_URL:'https://sightseeingshkodra.app'};
test('admin canonical origin is .com independently of public customer links and safe login query survives alias redirects',()=>{
 assert.equal(adminSiteOrigin(prod),canonicalAdminOrigin);assert.equal(prod.NEXT_PUBLIC_SITE_URL,'https://sightseeingshkodra.app');
 const path='/admin/10000000-0000-4000-8000-000000000001/bookings?booking=10000000-0000-4000-8000-000000000002';
 for(const host of ['sightseeingshkodra.app','www.sightseeingshkodra.app','sightseeingshkodra.com'])assert.equal(canonicalAdminRedirect('https://'+host+path,'GET',prod),canonicalAdminOrigin+path);
 assert.equal(canonicalAdminRedirect('https://sightseeingshkodra.app/auth/sign-in?next='+encodeURIComponent(path),'GET',prod),canonicalAdminOrigin+'/auth/sign-in?next='+encodeURIComponent(path));
 assert.equal(recoveryRedirect(adminSiteOrigin(prod)),canonicalAdminOrigin+'/auth/activate');
});
test('public bookings, customer management, existing worker identities, APIs and mutations are not redirected',()=>{
 for(const path of ['/book?productId=synthetic','/booking/manage','/api/public/checkout','/api/admin/notifications','/admin/sw.js','/admin/manifest.webmanifest'])assert.equal(canonicalAdminRedirect('https://sightseeingshkodra.app'+path,'GET',prod),null);
 assert.equal(canonicalAdminRedirect('https://sightseeingshkodra.app/admin','POST',prod),null);
 assert.equal(canonicalAdminRedirect(canonicalAdminOrigin+'/admin','GET',prod),null);
 assert.equal(canonicalAdminRedirect('https://untrusted.example/admin','GET',prod),null);
 assert.equal(canonicalAdminRedirect('http://127.0.0.1:3012/admin','GET',prod),null);
 assert.equal(adminSiteOrigin({...prod,VERCEL_ENV:'preview',NEXT_PUBLIC_SITE_URL:'https://isolated.example'}),'https://isolated.example');
});
