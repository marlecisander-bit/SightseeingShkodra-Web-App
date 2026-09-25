/* Install in the independent map AFTER its existing public presentation scripts.
 * Read-only: relays rendered public status, never coordinates or GPS calculations.
 * Parent initiates the handshake, so no message is sent to an unknown origin.
 */
(function () {
  const allowed = new Set(['http://127.0.0.1:3000', 'http://localhost:3000']);
  let parentOrigin = null;
  function send() {
    if (!parentOrigin) return;
    const card = document.getElementById('next-card');
    if (!card) return;
    const text = id => (document.getElementById(id)?.innerText || '').trim().slice(0, 180);
    const warning=document.getElementById('tourist-location-warning');
    window.parent.postMessage({type:'shkodra:public-status',version:1,label:text('next-label'),name:text('next-stop-name'),movement:warning&&!warning.hidden?warning.innerText.trim().slice(0,180):text('van-movement-status'),unavailable:!!warning&&!warning.hidden},parentOrigin);
  }
  window.addEventListener('message', event => {
    if (event.source !== window.parent || !allowed.has(event.origin) || event.data?.type !== 'shkodra:request-status') return;
    parentOrigin = event.origin; send();
  });
  const card=document.getElementById('next-card');
  if (card) new MutationObserver(send).observe(card,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['class','hidden']});
  // Heartbeat reuses presentation only; it does not query any service.
  setInterval(send,15000);
})();
