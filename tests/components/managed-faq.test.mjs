import {test} from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {FaqPage} from '../../src/components/public/faq-page.tsx';
import {initialWebsiteContent} from '../../src/modules/content/website-schema.ts';
test('public FAQ follows active array order and escapes answer markup',()=>{
 const items=[{id:'b',question:'Second first?',answer:'<script>bad()</script>',active:true,answerSource:'text'},{id:'a',question:'Hidden?',answer:'Private draft',active:false,answerSource:'text'},{id:'c',question:'Last?',answer:'Last answer',active:true,answerSource:'text'}];
 const render=rows=>renderToStaticMarkup(React.createElement(FaqPage,{content:{...initialWebsiteContent,'faq.items':JSON.stringify(rows)},inclusions:null}));
 const html=render(items);assert.ok(html.indexOf('Second first?')<html.indexOf('Last?'));assert.ok(!html.includes('Hidden?'));assert.ok(html.includes('&lt;script&gt;'));assert.ok(!html.includes('<script>'));assert.ok(render([]).includes('will be published here soon'));
});
