/* Private Dropbox document synchronization. No credentials are stored in app data. */
(function(root){'use strict';
const PATH='/Velto/velto-data.json',SCOPES=['files.content.read','files.content.write'];
let bridge=null,epoch=0,debounce=null,pollTimer=null,job=null,deviceJob=Promise.resolve(),controllers=new Set();
function initialState(){return {phase:'disconnected',message:'Connect Dropbox to synchronize devices.',ready:false,bound:false,dirty:false,accountId:'',rev:'',lastSyncedAt:'',generation:0,offline:false,deviceSaved:false,lastDeviceSavedAt:0,needsAccess:false}}
let state=initialState();
const clone=v=>JSON.parse(JSON.stringify(v));
function stable(v){if(Array.isArray(v))return '['+v.map(stable).join(',')+']';if(v&&typeof v==='object')return '{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+stable(v[k])).join(',')+'}';return JSON.stringify(v)}
function status(){return {...state}}
function emit(phase,message){state.phase=phase;state.message=message;bridge?.onStatus?.(status())}
function access(){const a=bridge?.getAccess?.();return a&&a.token&&a.accountId&&a.exp>Date.now()+10000&&SCOPES.every(s=>a.scopes?.includes(s))?a:null}
function safeData(data){if(!data||typeof data!=='object'||Array.isArray(data))throw Error('The Dropbox data is not a Velto backup.');for(const key of ['transactions','invoices','invoiceCustomers','accounts','recurring'])if(!Array.isArray(data[key]))throw Error('The Dropbox data has an invalid '+key+' field.');if(!Number.isFinite(data.savingsBalance)||data.savingsBalance<0)throw Error('The Dropbox savings balance is invalid.');for(const key of ['transactions','invoices','invoiceCustomers','recurring']){const ids=new Set();for(const record of data[key]){if(!record||typeof record!=='object'||Array.isArray(record)||typeof record.id!=='string'||!/^[A-Za-z0-9:_-]{1,160}$/.test(record.id)||ids.has(record.id))throw Error('The Dropbox '+key+' contains invalid or duplicate record IDs.');ids.add(record.id)}}if(data.goals!==undefined&&!Array.isArray(data.goals))throw Error('The Dropbox savings data is invalid.');for(const key of ['invoiceSettings','invoiceProfile'])if(!data[key]||typeof data[key]!=='object'||Array.isArray(data[key]))throw Error('The Dropbox '+key+' field is invalid.');const result=clone(data);delete result.__proto__;delete result.constructor;delete result.prototype;return result}
function content(data){return !!(data.transactions?.length||data.invoices?.length||data.invoiceCustomers?.length||data.recurring?.length||data.salaryPlan||data.savingsBalance||data.invoiceProfile?.supplierName||data.accounts?.some(a=>Number(a.opening)!==0))}
function envelope(data){return {app:'velto',version:1,updatedAt:new Date().toISOString(),data:safeData(data)}}
function header(value){return JSON.stringify(value).replace(/[\u007f-\uffff]/g,c=>'\\u'+c.charCodeAt(0).toString(16).padStart(4,'0'))}
function problem(response,body){const e=Error(response.status===401?'Dropbox sign-in expired. Reconnect to synchronize.':response.status===403?'Enable files.content.read and files.content.write in the Dropbox app, then reconnect.':body?.error_summary||'Dropbox synchronization failed ('+response.status+').');e.status=response.status;return e}
function stale(n){if(n!==epoch){const e=Error('Synchronization cancelled');e.name='AbortError';throw e}}
async function request(url,options,n){const a=access();if(!a){const e=Error('Connect Dropbox with read and write permission to synchronize.');e.status=401;throw e}const controller=new AbortController();controllers.add(controller);try{const response=await fetch(url,{...options,headers:{Authorization:'Bearer '+a.token,...options.headers},signal:controller.signal});stale(n);return response}finally{controllers.delete(controller)}}
async function read(n,allowMissing=false){const r=await request('https://content.dropboxapi.com/2/files/download',{method:'POST',headers:{'Dropbox-API-Arg':header({path:PATH})}},n);if(!r.ok){const b=await r.json().catch(()=>({}));stale(n);const missing=(r.status===409&&b.error?.['.tag']==='path'&&b.error.path?.['.tag']==='not_found')||r.status===404;if(allowMissing&&missing)return null;throw problem(r,b)}const raw=await r.text();stale(n);if(raw.length>20*1024*1024)throw Error('The Dropbox data file is too large.');let meta,doc;try{meta=JSON.parse(r.headers.get('Dropbox-API-Result')||'null');doc=JSON.parse(raw)}catch{throw Error('The Dropbox data file is not valid JSON.')}if(!meta?.rev||doc?.app!=='velto'||doc.version!==1)throw Error('The Dropbox file has an unsupported format. Nothing has been replaced.');return {rev:meta.rev,data:safeData(doc.data)}}
async function write(data,rev,n){if(!rev){const directory=await request('https://api.dropboxapi.com/2/files/create_folder_v2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({path:'/Velto',autorename:false})},n),body=await directory.json().catch(()=>({}));stale(n);const exists=directory.status===409&&body.error?.['.tag']==='path'&&body.error.path?.['.tag']==='conflict'&&body.error.path.conflict?.['.tag']==='folder';if(!directory.ok&&!exists)throw problem(directory,body)}const r=await request('https://content.dropboxapi.com/2/files/upload',{method:'POST',headers:{'Content-Type':'application/octet-stream','Dropbox-API-Arg':header({path:PATH,mode:rev?{'.tag':'update',update:rev}:'add',autorename:false,strict_conflict:true,mute:true})},body:new Blob([JSON.stringify(envelope(data))],{type:'application/octet-stream'})},n),b=await r.json().catch(()=>({}));stale(n);if(!r.ok)throw problem(r,b);if(!b.rev||!b.id)throw Error('Dropbox did not confirm the saved data.');return b.rev}
function pending(){return state.dirty}
function android(){return root.VELTO_ANDROID===true||bridge?.allowOffline===true}
function deviceAccount(){return android()?String(bridge?.getAccountId?.()||root.getVeltoDeviceAccountId?.()||''):''}
async function cached(accountId){
 const value=await (bridge?.readCached||root.readCachedVelto)?.(accountId);
 if(!value||value.accountId!==accountId)return null;
 return {accountId,data:safeData(value.data),rev:typeof value.rev==='string'?value.rev:'',savedAt:Number(value.savedAt)||Date.parse(value.savedAt)||0};
}
function readPending(accountId){const value=bridge?.readPending?.(accountId);if(value&&android()&&!pendingMeta(accountId))throw Error('Pending device changes could not be matched to this Dropbox account.');return value?safeData(value):null}
function pendingMeta(accountId){const value=(bridge?.readPendingMeta||root.readPendingVeltoMeta)?.(accountId);return value&&value.accountId===accountId?value:null}
function offlineMessage(){return state.deviceSaved?(state.dirty?'Saved on device. Pending Dropbox sync.':'Offline. Your data is saved on this device.'):'Changes are only in memory. Keep Velto open until they are saved.'}
function requireLocalAccount(id){if(!id||id!==state.accountId)throw Error('The device data belongs to a different Dropbox account.')}
async function cacheConfirmed(data,rev,n){
 if(!android())return;
 const persist=bridge?.persistCached||root.persistCachedVelto;
 if(typeof persist!=='function')throw Error('Encrypted device storage is unavailable. Keep Velto open until synchronized.');
 const accountId=state.accountId,copy=safeData(data);
 await persist(clone(copy),accountId,rev);stale(n);
 state.lastDeviceSavedAt=Date.now();
 if(!state.dirty)state.deviceSaved=true;
}
function remember(){
 const accountId=state.accountId,generation=state.generation,n=epoch,data=clone(bridge.getData()),baseRev=state.rev||'';
 let result;
 try{if(android()&&typeof bridge?.persistPending!=='function')throw Error('Encrypted device storage is unavailable.');result=bridge?.persistPending?.(data,accountId,baseRev)}catch(error){result=Promise.reject(error)}
 if(!android()){
  Promise.resolve(result).catch(()=>emit('error','Pending changes could not be saved on this device. Keep this tab open until synchronized.'));
  return Promise.resolve(true);
 }
 state.deviceSaved=false;
 const task=Promise.resolve(result).then(()=>{
  if(n!==epoch||accountId!==state.accountId)return false;
  if(generation===state.generation){state.deviceSaved=true;state.lastDeviceSavedAt=Date.now();}
  return true;
 });
 deviceJob=task;return task;
}
async function restoreOffline(n,error=null){
 if(!android())return false;
 const id=state.accountId||deviceAccount();if(!id)return false;
 const snapshot=await cached(id),queued=readPending(id),meta=pendingMeta(id);
 stale(n);
 if(!snapshot&&!queued)return false;
 const data=queued||snapshot.data;
 stale(n);state.accountId=id;state.rev=queued?(typeof meta?.baseRev==='string'?meta.baseRev:''):snapshot?.rev||'';state.bound=true;state.ready=true;state.offline=true;state.dirty=!!queued;state.deviceSaved=queued?meta?.saved!==false:true;state.lastDeviceSavedAt=snapshot?.savedAt||Date.now();state.needsAccess=!!(error?.status===401||error?.status===403||!access());
 await bridge.applyData(clone(data));stale(n);
 bridge.onAuthenticated?.();emit('offline',offlineMessage());return true;
}
async function report(error,n=epoch){
 if(error.name==='AbortError')return false;
 if(error.status===409){emit('conflict','Another device saved changes. Resolve the conflict before continuing synchronization.');return false}
 if(android()){
  if(state.bound&&state.ready&&state.accountId){
   state.offline=true;state.needsAccess=error.status===401||error.status===403||!access();
   bridge.onAuthenticated?.();emit('offline',offlineMessage());return true;
  }
  try{if(await restoreOffline(n,error))return true}catch(storageError){if(storageError.name==='AbortError')return false;emit('error','Saved device data could not be opened. Reconnect Dropbox to continue.');return false}
 }
 if(error.status===401){state.ready=false;emit('auth',error.message)}else emit('error',error.message||'Synchronization is unavailable. Your current data has been kept.');return false;
}
async function backup(data,reason){if(content(data)&&bridge.backup){const ok=await bridge.backup(clone(data),reason);if(ok===false)throw Error('Download a recovery backup before replacing data.')}}
async function finishClean(data,rev,n){
 stale(n);const generation=state.generation;state.rev=rev;state.ready=true;state.bound=true;state.offline=false;state.needsAccess=false;state.dirty=false;state.lastSyncedAt=new Date().toISOString();
 await bridge.applyData(clone(data));stale(n);
 try{await cacheConfirmed(data,rev,n)}catch(error){if(error.name==='AbortError')throw error;state.deviceSaved=false;state.dirty=true;try{await remember()}catch{}bridge.onAuthenticated?.();emit('device-error','Dropbox is synchronized, but device storage failed. Keep Velto open and retry synchronization.');return false}
 if(generation===state.generation){await bridge.clearPending?.(state.accountId);stale(n)}
 else state.dirty=true;
 bridge.onAuthenticated?.();
 if(state.dirty){emit(android()&&!state.deviceSaved?'local-saving':'pending',android()?(state.deviceSaved?'Saved on device. Pending Dropbox sync.':'Saving on this device...'):'Saving additional changes to Dropbox...');debounce=setTimeout(()=>flush().catch(()=>{}),0)}
 else emit('synced',android()?'Synced with Dropbox. Saved on device.':'All changes synchronized with Dropbox.');return true;
}
async function pushPrepared(data,rev,n){
 stale(n);const generation=state.generation,confirmed=clone(data);state.rev=rev||'';state.ready=true;state.bound=true;state.offline=false;state.needsAccess=false;state.dirty=true;
 await bridge.applyData(clone(data));stale(n);await remember();stale(n);
 const newRev=await write(confirmed,state.rev,n);stale(n);
 if(generation===state.generation)return finishClean(confirmed,newRev,n);
 state.rev=newRev;state.lastSyncedAt=new Date().toISOString();await cacheConfirmed(confirmed,newRev,n);stale(n);bridge.onAuthenticated?.();emit(android()&&!state.deviceSaved?'local-saving':'pending',android()?(state.deviceSaved?'Saved on device. Pending Dropbox sync.':'Saving on this device...'):'Saving additional changes to Dropbox...');debounce=setTimeout(()=>flush().catch(()=>{}),0);return true;
}
async function choose(remote,local,n,kind){
 const decisionGeneration=state.generation,choice=await bridge.decide({kind,local:clone(local),remote:remote?clone(remote.data):null,rev:remote?.rev||''});stale(n);
 if(android()&&decisionGeneration!==state.generation){emit('conflict','Saved device data changed while choosing. Review the conflict again before synchronizing.');return false}
 if(choice==='cancel'||!choice){emit('paused','Synchronization paused. Your data has been kept.');return false}
 if(choice==='cloud'&&remote){await backup(local,'device-before-cloud');return finishClean(remote.data,remote.rev,n)}
 if(choice!=='local')return false;
 if(remote)await backup(remote.data,'cloud-before-device');state.generation++;return pushPrepared(local,remote?.rev||'',n);
}
async function connected(force=false){
 if(!bridge)throw Error('Synchronization is not initialized');
 const a=access(),id=a?.accountId||deviceAccount();
 if(job&&!force&&id===state.accountId)return job;
 if(job){epoch++;for(const c of controllers)c.abort();controllers.clear();job=null}
 if(!a&&!android()){emit('auth','Dropbox needs files.content.read and files.content.write permission. Reconnect to synchronize.');bridge.requireAccess?.();return false}
 if(!id){emit('auth','Connect Dropbox once online before using this device offline.');if(!android())bridge.requireAccess?.();return false}
 const n=++epoch;for(const c of controllers)c.abort();controllers.clear();clearTimeout(debounce);
 const previousAccount=state.accountId,wasBound=state.bound&&previousAccount===id;
 state.accountId=id;if(previousAccount&&previousAccount!==id){state.bound=false;state.ready=false;state.dirty=false;state.rev='';state.offline=false;state.deviceSaved=false;}
 job=(async()=>{try{
  let snapshot=android()?await cached(id):null;stale(n);let queued=readPending(id),meta=pendingMeta(id),local=bridge.hosted&&previousAccount&&previousAccount!==id?bridge.freshData():clone(bridge.getData());
  if(queued)local=queued;else if(snapshot&&!wasBound)local=snapshot.data;
  let baseRev=queued?(typeof meta?.baseRev==='string'?meta.baseRev:''):wasBound&&state.rev?state.rev:snapshot?.rev||'';const hadConfirmedCache=!!snapshot||wasBound;
  if(android()&&!wasBound&&(snapshot||queued)){await restoreOffline(n);stale(n)}
  else if(!wasBound)state.ready=false;
  if(!a){if(state.bound&&state.ready){state.offline=true;state.needsAccess=true;emit('offline',offlineMessage());return true}emit('auth','Connect Dropbox once online before using this device offline.');return false}
  emit('loading',android()&&state.bound?'Saved on device. Checking Dropbox for changes...':'Loading your private Dropbox data...');
  const remote=await read(n,!state.bound||!baseRev||previousAccount!==id);stale(n);
  queued=readPending(id);meta=pendingMeta(id);if(queued){local=queued;if(android())baseRev=typeof meta?.baseRev==='string'?meta.baseRev:'';}else if(android()&&state.bound&&state.accountId===id)local=clone(bridge.getData());
  const dirty=!!queued||state.dirty;
  if(android()&&state.bound&&bridge.isEditing?.()){state.rev=baseRev;state.ready=true;state.offline=true;emit('offline','Saved on device. Finish the current entry to check Dropbox changes.');return false}
  if(!remote)return choose(null,local,n,'bootstrap');
  if(android()&&hadConfirmedCache){
   if(stable(local)===stable(remote.data))return finishClean(remote.data,remote.rev,n);
   if(dirty){if(baseRev&&remote.rev===baseRev)return pushPrepared(safeData(local),remote.rev,n);return choose(remote,safeData(local),n,'conflict')}
   if(bridge.isEditing?.()){state.rev=baseRev;state.ready=true;state.bound=true;state.offline=true;emit('offline','Saved on device. Finish the current entry to check Dropbox changes.');return false}
   return finishClean(remote.data,remote.rev,n);
  }
  if((content(local)||android()&&dirty)&&stable(local)!==stable(remote.data))return choose(remote,local,n,queued||state.dirty?'recovery':'initial');
  return finishClean(remote.data,remote.rev,n);
 }catch(error){return await report(error,n)}finally{if(n===epoch)job=null}})();return job;
}
function changed(){
 if(!state.bound)return;state.generation++;state.dirty=true;
 if(!android()){
  remember();if(state.phase==='conflict'||!state.ready)return;emit('pending','Saving changes to Dropbox...');clearTimeout(debounce);debounce=setTimeout(()=>flush().catch(()=>{}),650);return;
 }
 const generation=state.generation,changeEpoch=epoch,holdConflict=state.phase==='conflict';emit(holdConflict?'conflict':'local-saving',holdConflict?'Changes are being saved on device. Resolve the Dropbox conflict before synchronizing.':'Saving on this device...');
 remember().then(()=>{if(changeEpoch!==epoch||generation!==state.generation)return;if(holdConflict){emit('conflict','Saved on device. Resolve the Dropbox conflict before synchronizing.');return}if(state.offline||!access()){state.offline=true;state.needsAccess=!access();emit('offline',offlineMessage());return}emit('pending','Saved on device. Pending Dropbox sync.');clearTimeout(debounce);debounce=setTimeout(()=>flush().catch(()=>{}),650)}).catch(()=>{if(changeEpoch===epoch&&generation===state.generation){state.deviceSaved=false;emit('device-error','Could not save changes on this device. Keep Velto open and retry.')}});
}
async function flush(){
 clearTimeout(debounce);if(job){await job;if(!state.dirty)return true}if(!state.dirty)return true;
 if(android()){
  try{await deviceJob}catch{await remember()}
  if(state.offline||!state.ready||!access()){await connected();if(!state.dirty)return true;if(state.offline||!state.ready)throw Error(offlineMessage());}
 }
 if(!state.ready||state.phase==='conflict')throw Error(state.message||'Resolve synchronization before signing out.');
 const n=epoch;job=(async()=>{try{
  while(state.dirty){stale(n);await deviceJob;stale(n);const generation=state.generation,data=safeData(bridge.getData());emit('saving',android()?'Saved on device. Synchronizing with Dropbox...':'Saving changes to Dropbox...');const rev=await write(data,state.rev,n);stale(n);state.rev=rev;state.lastSyncedAt=new Date().toISOString();await cacheConfirmed(data,rev,n);stale(n);if(generation===state.generation){state.dirty=false;await bridge.clearPending?.(state.accountId);stale(n)}}
  state.offline=false;state.needsAccess=false;state.deviceSaved=android()?true:state.deviceSaved;emit('synced',android()?'Synced with Dropbox. Saved on device.':'All changes synchronized with Dropbox.');return true;
 }catch(error){await report(error,n);throw error}finally{if(n===epoch)job=null}})();return job;
}
async function pull(explicit=true){
 if(job)return false;if(!state.bound)return explicit?connected():false;
 if(android()&&state.offline){if(bridge.isEditing?.()&&!explicit)return false;return connected()}
 if(!access()){if(android()){await report(Object.assign(Error('Reconnect Dropbox to synchronize.'),{status:401}));if(explicit)bridge.requireAccess?.();return false}emit('auth','Reconnect Dropbox to synchronize.');if(explicit)bridge.requireAccess?.();return false}
 if(!explicit&&(state.dirty||bridge.isEditing?.()))return false;
 if(state.dirty&&state.phase!=='conflict'){try{await flush()}catch{return false}}
 const n=epoch;job=(async()=>{try{
  const remote=await read(n,false);stale(n);
  if(state.dirty||state.phase==='conflict')return choose(remote,safeData(bridge.getData()),n,'conflict');
  if(remote.rev===state.rev){emit('synced',android()?'Synced with Dropbox. Saved on device.':'All changes synchronized with Dropbox.');return true}
  if(bridge.isEditing?.())return false;return finishClean(remote.data,remote.rev,n);
 }catch(error){return await report(error,n)}finally{if(n===epoch)job=null}})();return job;
}
function disconnect(){epoch++;clearTimeout(debounce);for(const c of controllers)c.abort();controllers.clear();job=null;deviceJob=Promise.resolve();state=initialState();emit('disconnected',state.message)}
function init(options){
 if(bridge)return api;bridge=options;pollTimer=setInterval(()=>{if(state.bound)pull(false)},60000);
 root.addEventListener?.('focus',()=>{if(state.bound)pull(false)});
 root.addEventListener?.('online',()=>{if(android()&&state.bound&&(state.offline||!access())){if(!access()){(bridge?.requireRefresh||root.requestVeltoAccessRefresh)?.();return}if(!bridge.isEditing?.())connected();return}if(state.dirty&&state.ready&&state.phase!=='conflict')flush().catch(()=>{});else if(state.bound)pull(false)});
 root.addEventListener?.('beforeunload',e=>{if(state.dirty){e.preventDefault();e.returnValue=''}});
 emit('disconnected',state.message);if(access()||android()&&deviceAccount())connected();return api;
}
async function connectionUnavailable({message='Offline. Changes stay saved on this device.',reconnect=false}={}){if(!android())return false;return report(Object.assign(Error(message),{status:reconnect?401:0}))}
const api={init,connected,changed,flush,pull,disconnect,status,connectionUnavailable,hasPending:pending,validate:safeData,path:PATH};root.VeltoCloud=api;
})(globalThis);
