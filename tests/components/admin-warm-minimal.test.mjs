import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFileSync} from 'node:fs';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {JSDOM} from 'jsdom';
import {AdminIcon,adminPrimaryIcons} from '../../src/app/admin/admin-icon.tsx';
import {AdminStatus,adminStatusTone} from '../../src/app/admin/admin-status.tsx';
const root=new URL('../../',import.meta.url);
const read=p=>readFileSync(new URL(p,root),'utf8');
const luminance=hex=>{const c=hex.replace('#','').match(/../g).map(v=>parseInt(v,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return .2126*c[0]+.7152*c[1]+.0722*c[2];};
const contrast=(a,b)=>{const l=[luminance(a),luminance(b)].sort((a,b)=>b-a);return (l[0]+.05)/(l[1]+.05);};
test('admin palette stays shell-scoped; functional text and control pairs meet AA contrast',()=>{
 const css=read('src/app/admin/admin.module.css'),section=css.slice(css.indexOf('/* Phase A.1'));
 assert.ok(section.includes('.shell {'));assert.ok(!section.includes(':root'));
 const palette={'primary':'#C62832','primary-hover':'#A91F29','primary-soft':'#FBEDEF','background':'#FAFAF8','surface':'#FFFFFF','text':'#20252B','text-muted':'#68737D','border':'#E7E9EC','success':'#238365','warning':'#B76A18','danger':'#C62832'};
 for(const [name,value]of Object.entries(palette))assert.ok(section.includes(`--admin-${name}:${value}`),name);
 for(const [fg,bg]of [['#FFFFFF','#C62832'],['#FFFFFF','#A91F29'],['#20252B','#FAFAF8'],['#68737D','#FFFFFF'],['#68737D','#FAFAF8'],['#C62832','#FBEDEF'],['#1A7055','#EDF7F2'],['#855013','#FFF4E5'],['#5E6872','#F2F3F5']])assert.ok(contrast(fg,bg)>=4.5,`${fg}/${bg}: ${contrast(fg,bg)}`);
 assert.ok(contrast('#858E96','#FFFFFF')>=3);assert.ok(contrast('#A91F29','#FAFAF8')>=3);
 assert.ok(section.includes('@media(prefers-reduced-motion:reduce)'));
 assert.ok(section.includes(':focus-visible {outline:3px'));
});
test('Lucide subset uses one outline system with hidden decorative icons and intact notices',()=>{
 assert.deepEqual(adminPrimaryIcons,{overview:'layout-dashboard',bookings:'calendar-check',tours:'bus-front',website:'panels-top-left',reports:'chart-no-axes-combined',settings:'settings-2'});
 const icons=JSON.parse(read('src/app/admin/admin-icons.json'));
 for(const name of Object.keys(icons)){
  const dom=new JSDOM(renderToStaticMarkup(React.createElement(AdminIcon,{name}))),svg=dom.window.document.querySelector('svg');
  assert.equal(svg.getAttribute('aria-hidden'),'true');assert.equal(svg.getAttribute('focusable'),'false');assert.equal(svg.getAttribute('width'),'20');assert.equal(svg.getAttribute('fill'),'none');assert.equal(svg.getAttribute('stroke-width'),'1.8');
  for(const child of svg.children){assert.ok(['path','circle','rect','line','polyline','polygon','ellipse'].includes(child.tagName));for(const a of child.attributes)assert.ok(!a.name.startsWith('on')&&!a.value.includes('http'));}
  dom.window.close();
 }
 const license=read('src/app/admin/LUCIDE-LICENSE.txt');assert.match(license,/ISC License/);assert.match(license,/MIT License/);
});
test('status presentation preserves existing labels and treats unknown statuses as neutral',()=>{
 for(const [status,tone]of [['confirmed','success'],['pending','warning'],['cancelled','danger'],['failed','danger'],['archived','neutral'],['inactive','neutral'],['future-status','neutral']]){
  assert.equal(adminStatusTone(status),tone);const dom=new JSDOM(renderToStaticMarkup(React.createElement(AdminStatus,{status},status)));
  assert.equal(dom.window.document.querySelector('span').textContent,status);assert.equal(dom.window.document.querySelector('span').dataset.adminStatus,tone);dom.window.close();
 }
});
test('calendar touch targets pan within a named focusable region without changing date actions',()=>{
 const css=read('src/app/admin/calendar.module.css'),component=read('src/app/admin/operations-calendar.tsx');
 assert.match(css,/\.calendarViewport\{[^}]*overflow-x:auto/);assert.match(css,/\.grid\{min-width:326px/);assert.match(css,/min-width:44px!important;min-height:48px/);
 assert.ok(component.includes('role="region" aria-label="Monthly dates" tabIndex={0}'));assert.ok(component.includes('onClick={()=>open(day)}'));
});
