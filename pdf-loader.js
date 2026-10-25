/* Mozilla PDF.js 6.4.299 is bundled locally. No invoice is uploaded for extraction. */
(function(){'use strict';
let pending;
function script(path){return new Promise((resolve,reject)=>{const element=document.createElement('script');element.src=new URL(path,document.baseURI).href;element.async=true;element.onload=resolve;element.onerror=()=>{element.remove();reject(Error('The PDF reader could not load. Please reload Velto and try again.'))};document.head.appendChild(element)})}
window.getVeltoPdfJs=function(){
 if(pending)return pending;
 pending=(async()=>{
  if(!globalThis.pdfjsWorker?.WorkerMessageHandler)await script('./vendor/pdfjs-worker.min.js?v=6.4.299');
  if(!globalThis.pdfjsLib?.getDocument)await script('./vendor/pdfjs.min.js?v=6.4.299');
  if(globalThis.pdfjsLib?.version!=='6.4.299')throw Error('The PDF reader version is out of date. Reload Velto and try again.');
  return globalThis.pdfjsLib;
 })().catch(error=>{pending=null;throw error});return pending;
};
})();
