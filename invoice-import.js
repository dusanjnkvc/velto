/* Local PDF invoice import. PDF contents never leave this device. */
(function(global){'use strict';
const MAX_BYTES=20*1024*1024,MAX_PAGES=30;
const fold=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const clean=value=>String(value||'').replace(/[\u00a0\u202f]/g,' ').replace(/\s+/g,' ').trim();
const DATE_RE=/\b(?:\d{4}\s*-\s*\d{1,2}\s*-\s*\d{1,2}|\d{1,2}\s*[./-]\s*\d{1,2}\s*[./-]\s*\d{4})\b/g;
const NUMBER_SOURCE="[-+]?(?:\\d{1,3}(?:[ \\u00a0'.,]\\d{3})+|\\d+)(?:[.,]\\d{1,4})?";
let importing=false;

function parseNumber(value){
 let s=clean(value).replace(/(?:EUR|USD|GBP|CZK|\u20ac|\$|\u00a3)/gi,'').replace(/[ '\u00a0]/g,'').trim();
 if(!/^[+-]?\d[\d.,]*$/.test(s))return null;
 const comma=s.lastIndexOf(','),dot=s.lastIndexOf('.');
 if(comma>=0&&dot>=0){const decimal=comma>dot?',':'.';s=s.replace(decimal===','?/\./g:/,/g,'');s=s.replace(decimal,'.');}
 else if(comma>=0||dot>=0){const mark=comma>=0?',':'.',pieces=s.split(mark);if(pieces.length>2&&pieces.slice(1).every(p=>p.length===3))s=pieces.join('');else if(pieces.length===2&&pieces[1].length===3)s=pieces.join('');else if(pieces.length===2)s=pieces[0]+'.'+pieces[1];else return null;}
 const n=Number(s);return Number.isFinite(n)?n:null;
}
function parseDate(value){
 const s=clean(value).replace(/\s/g,'');let match=s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/),y,m,d;
 if(match){y=+match[1];m=+match[2];d=+match[3];}
 else{match=s.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/);if(!match)return '';d=+match[1];m=+match[2];y=+match[3];}
 const date=new Date(Date.UTC(y,m-1,d));if(y<1900||y>2200||date.getUTCFullYear()!==y||date.getUTCMonth()!==m-1||date.getUTCDate()!==d)return '';
 return String(y).padStart(4,'0')+'-'+String(m).padStart(2,'0')+'-'+String(d).padStart(2,'0');
}
function buildLines(pages){
 const out=[];
 pages.forEach((page,pageIndex)=>{
  if(typeof page==='string'){page.split(/\r?\n/).forEach((text,index)=>{if(clean(text))out.push({page:pageIndex,y:index*12,x:0,width:600,items:[{str:clean(text),x:0,width:600}],text:clean(text),positioned:false});});return;}
  const items=(page.items||[]).filter(item=>clean(item.str)).map(item=>({str:clean(item.str),x:Number(item.transform?.[4]??item.x??0),y:page.height!=null?Number(page.height)-Number(item.transform?.[5]??0):Number(item.y||0),width:Math.abs(Number(item.width)||0),height:Math.abs(Number(item.height||item.transform?.[3]))||9})).sort((a,b)=>a.y-b.y||a.x-b.x);
  const rows=[];for(const item of items){let row=rows.find(r=>Math.abs(r.y-item.y)<=2.8);if(!row){row={page:pageIndex,y:item.y,items:[],positioned:true};rows.push(row);}row.items.push(item);}
  for(const row of rows){row.items.sort((a,b)=>a.x-b.x);row.text=row.items.map(item=>item.str).join(' ');row.x=row.items[0].x;row.width=Math.max(...row.items.map(item=>item.x+item.width))-row.x;out.push(row);}
 });
 return out.sort((a,b)=>a.page-b.page||a.y-b.y||a.x-b.x);
}
function xAt(line,index){let offset=0;for(const item of line.items){if(index<=offset+item.str.length)return item.x+(item.width||0)*Math.max(0,index-offset)/Math.max(1,item.str.length);offset+=item.str.length+1;}return line.x+line.width;}
function subline(line,items){return {...line,items,text:items.map(item=>item.str).join(' '),x:items[0]?.x||0};}
function fieldValue(lines,label,valueRe,below=true){
 for(let i=0;i<lines.length;i++){
  const line=lines[i],match=fold(line.text).match(label);if(!match)continue;
  const start=match.index+match[0].length,after=line.text.slice(start),candidate=after.match(new RegExp(valueRe.source,valueRe.flags.replace(/g/g,'')));
  if(candidate&&!/[a-z]/.test(fold(after.slice(0,candidate.index)).replace(/\beur\b/g,'')))return clean(candidate[0]);
  if(!below)continue;
  const anchor=xAt(line,match.index),possible=[];
  for(let j=i+1;j<lines.length;j++){
   const next=lines[j];if(next.page!==line.page||next.y-line.y>50)break;if(next.y-line.y<2)continue;
   const expression=new RegExp(valueRe.source,valueRe.flags.includes('g')?valueRe.flags:valueRe.flags+'g');
   for(const hit of next.text.matchAll(expression)){const x=xAt(next,hit.index);if(line.positioned&&Math.abs(x-anchor)>75)continue;possible.push({value:clean(hit[0]),score:Math.abs(x-anchor)+(next.y-line.y)*0.35});}
  }
  if(possible.length)return possible.sort((a,b)=>a.score-b.score)[0].value;
 }
 return '';
}
function findHeading(lines,expression){for(const line of lines){const match=fold(line.text).match(expression);if(match)return {line,x:xAt(line,match.index),y:line.y,page:line.page};}return null;}
const SUPPLIER=/\b(?:dodavatel|supplier|seller)\b/;
const CUSTOMER=/\b(?:odberatel|customer|buyer|bill\s+to|billed\s+to)\b/;
const BOUNDARY=/\b(?:datum\s+vystavenia|datum\s+dodania|datum\s+splatnosti|issue\s+date|invoice\s+date|date\s+of\s+issue|delivery\s+date|due\s+date|tax\s+date|bankovy\s+ucet|bank\s+details|oznacenie\s+dodavky|popis\s+tovaru|description\s+of|invoice\s+items)\b/;
function partyLines(lines,heading,other,role){
 if(!heading)return [];
 const column=other&&Math.abs(other.x-heading.x)>160;
 const left=column?(heading.x<other.x?-Infinity:heading.x-16):-Infinity;
 const right=column?(heading.x<other.x?other.x-16:Infinity):Infinity;
 const result=[];
 for(const line of lines){
  if(line.page!==heading.page||line.y<heading.y-3)continue;
  if(!column&&other&&other.y>heading.y&&line.y>=other.y-2)break;
  if(line.y>heading.y+10&&BOUNDARY.test(fold(line.text)))break;
  const parts=line.items.filter(item=>item.x>=left&&item.x<right);if(!parts.length)continue;
  const row=subline(line,parts);if(BOUNDARY.test(fold(row.text)))break;result.push(row);
 }
 return result;
}
function readParty(lines,role){
 const fields={},prefix=role==='supplier'?'supplier':'customer';
 if(!lines.length)return fields;
 fields[prefix+'Ico']=fieldValue(lines,/\b(?:ico|company\s*(?:id|number)|registration\s*(?:no\.?|number))\b/,/\b\d[\d ]{5,14}\b/).replace(/\s/g,'');
 fields[prefix+'Dic']=fieldValue(lines,/\b(?:dic|tax\s*(?:id|number))\b/,/\b\d[\d ]{7,15}\b/).replace(/\s/g,'');
 fields[prefix+'VatId']=fieldValue(lines,/\b(?:ic\s*dph|vat\s*(?:id|number)|vatin)\b/,/\b[A-Z]{2}[A-Z0-9]{6,14}\b/i).replace(/\s/g,'');
 fields[prefix+'Email']=(lines.map(line=>line.text).join(' ').match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)||[])[0]||'';
 fields[prefix+'Phone']=fieldValue(lines,/\b(?:telefon|telephone|phone|tel\.?|mobil)\b/,/[+]?\d[\d ()-]{5,22}\d/);
 if(!fields[prefix+'Phone'])fields[prefix+'Phone']=lines.map(line=>line.text).find(text=>/^\+\d[\d ()-]{7,22}$/.test(text))||'';
 const names=[];let country='';
 for(const line of lines){let text=clean(line.text),f=fold(text);const heading=f.match(role==='supplier'?SUPPLIER:CUSTOMER);if(heading&&heading.index===0){text=clean(text.slice(heading[0].length).replace(/^\s*[:\-]\s*/,''));f=fold(text);}
  if(text===fields[prefix+'Phone'])continue;
  if(!text||/^(?:kontaktne\s+udaje|contact\s*(?:details|information))\b/.test(f))continue;
  if(/\b(?:ico|dic|ic\s*dph|vat\s*(?:id|number|payer)|company\s*id|tax\s*id|platitel\w*|platca\w*|e-?mail|telefon|telephone|phone|tel\.|iban|swift|bic)\b/.test(f)||/@/.test(text))continue;
  if(/^(?:slovensko|slovakia|slovenska\s+republika|ceska\s+republika|cesko|czech(?:ia|\s+republic)|srbsko|serbia|germany|deutschland|austria|osterreich|united\s+kingdom|united\s+states|poland|polsko|france|italia|italy|netherlands|hungary|madarsko)$/i.test(f)){country=text;continue;}
  if(/^(?:faktura|invoice|objednavka|order|bankovy|bank\s+details|symbol|na\s+uhradu|payment|sposob\s+platby)\b/.test(f))continue;
  names.push(text);
 }
 fields[prefix+'Name']=names.shift()||'';fields[prefix+'Address']=names.join(', ');fields[prefix+'Country']=country;
 if(role==='supplier'){
  const f=fold(lines.map(line=>line.text).join(' '));
  fields.supplierVatPayer=!/\b(?:nie\s+(?:(?:sme|je|som)\s+)?(?:platitel\w*|platca\w*)|neplatitel\w*|not\s+(?:a\s+)?vat|non[ -]?vat)\b/.test(f)&&(!!fields.supplierVatId||/\b(?:sme\s+platitel\w*|je\s+platitel\w*|vat\s+payer|registered\s+for\s+vat)\b/.test(f));
 }
 return fields;
}
function numericHits(line){const expression=new RegExp(NUMBER_SOURCE,'g');return [...line.text.matchAll(expression)].map(hit=>({raw:hit[0],value:parseNumber(hit[0]),x:xAt(line,hit.index),index:hit.index})).filter(hit=>hit.value!==null);}
function tableHeader(lines,page){
 const candidates=lines.filter(line=>line.page===page);
 for(let i=0;i<candidates.length;i++){
  const line=candidates[i],f=fold(line.text);if(!/(?:oznacenie\s+dodavky|popis\s+(?:tovaru|polozky)|description|item\s+description|nazov\s+polozky)/.test(f))continue;
  const header=[line,...candidates.slice(i+1,i+3).filter(row=>row.y-line.y<18)];
  const find=expression=>{for(const row of header){const match=fold(row.text).match(expression);if(match)return xAt(row,match.index);}return null;};
  const qty=find(/\b(?:pocet|mnozstvo|quantity|qty)\b/),unit=find(/(?:cena\s+za\s*m\.?\s*j\.?|jednotkova\s+cena|unit\s+price|price\s+per\s+unit)/),total=find(/\b(?:spolu|celkom|total(?:\s+price)?|amount)\b/),vat=find(/\b(?:dph|vat)\s*%/);
  if(qty!==null&&unit!==null&&total!==null)return {page,y:line.y,qty,unit,total,vat,positioned:line.positioned};
 }
 return null;
}
function readItems(lines,pages,warnings){
 const items=[];let previousHeader=null;
 const footer=/^(?:dovolujeme|v\s+pripade|payment\s+terms|payment\s+due|terms\b|late[ -]payment|spolu\s+na\s+uhradu|celkom\s+na\s+uhradu|na\s+uhradu|amount\s+(?:payable|due)|grand\s+total|subtotal|total\s+due|net\s+total|zaklad\s+dane|rekapitulacia|sadzba\s+dph|vat\s+total|vytlacil|created\s+(?:on|by)|spracovane|page\s+\d)/;
 for(let page=0;page<pages.length;page++){
  const own=tableHeader(lines,page),header=own||previousHeader;if(!header)continue;previousHeader=header;
  let pending='';
  for(const line of lines){if(line.page!==page||own&&line.y<=own.y+3)continue;const f=fold(line.text);if(footer.test(f))break;
   if(/(?:description|oznacenie\s+dodavky|jednotkova\s+cena|pocet\s*m\.?\s*j)/.test(f))continue;
   const hits=numericHits(line);let quantity=null,unitPrice=null,reportedLine=null,vatRate=null,description='';
   if(line.positioned&&header.positioned){
    const pick=(x,max)=>hits.map(hit=>({...hit,distance:Math.abs(hit.x-x)})).filter(hit=>hit.distance<max).sort((a,b)=>a.distance-b.distance)[0];
    const q=pick(header.qty,35),u=pick(header.unit,60),t=pick(header.total,70),v=header.vat!==null?pick(header.vat,30):null;
    if(q&&u&&t&&q!==u&&q.index!==u.index&&u.index!==t.index){quantity=q.value;unitPrice=u.value;reportedLine=t.value;vatRate=v?.value??null;description=clean(line.items.filter(item=>item.x<header.qty-20).map(item=>item.str).join(' '));}
   }
   if(quantity===null){
    const extraVat=header.vat!==null?'\\s+('+NUMBER_SOURCE+')%?':'';
    const expression=new RegExp('^(.+?)\\s+('+NUMBER_SOURCE+')\\s+(?:(?:ks|pcs|h|hod|hours?)\\s+)?('+NUMBER_SOURCE+')'+extraVat+'\\s+('+NUMBER_SOURCE+')(?:\\s*(?:EUR|\\u20ac))?$','i');
    const m=line.text.match(expression);if(m){description=clean(m[1]);quantity=parseNumber(m[2]);unitPrice=parseNumber(m[3]);if(header.vat!==null){vatRate=parseNumber(m[4]);reportedLine=parseNumber(m[5]);}else reportedLine=parseNumber(m[4]);}
   }
   if(quantity!==null&&unitPrice!==null&&quantity>0&&unitPrice>=0&&description){
    description=clean(pending+' '+description);pending='';
    const item={description,quantity,unitPrice,vatRate:vatRate??0};
    const computed=Math.round(quantity*unitPrice*100)/100;
    if(reportedLine!==null&&Math.abs(computed-reportedLine)>0.02&&!(vatRate!==null&&Math.abs(computed*(1+vatRate/100)-reportedLine)<=0.02))warnings.push('A line total differs from quantity x unit price. Check the imported line items.');
    items.push(item);
   }else if(!hits.length&&line.positioned&&line.items.every(item=>item.x<header.qty-20)&&!/\b(?:bank|iban|swift|faktura|invoice|datum|dodavatel|odberatel|supplier|customer)\b/.test(f)){
    if(items.length&&line.y-(items.at(-1)._y||0)<22)items.at(-1).description=clean(items.at(-1).description+' '+line.text);else pending=clean(pending+' '+line.text);
   }
   if(items.length)items.at(-1)._y=line.y;
  }
 }
 return items.map(({_y,...item})=>item);
}
function readTotal(lines){
 const priorities=[[/\b(?:spolu\s+na\s+uhradu|celkom\s+na\s+uhradu|grand\s+total|amount\s+payable|total\s+due|balance\s+due)\b/,3],[/\b(?:na\s+uhradu|amount\s+due|total\s+amount|celkova\s+suma)\b/,2],[/^(?:total|celkom)\b/,1]];
 const money=new RegExp(NUMBER_SOURCE,'g');
 for(const [label] of priorities){const found=[];for(const line of lines){const match=fold(line.text).match(label);if(!match)continue;const value=fieldValue([line,...lines.filter(next=>next.page===line.page&&next.y>line.y&&next.y-line.y<=40)],label,money);if(value){const n=parseNumber(value);if(n!==null)found.push(n);}}if(found.length)return found.at(-1);}
 return null;
}
function parsePages(input,{fileName=''}={}){
 const pages=typeof input==='string'?[input]:input;
 if(!Array.isArray(pages)||!pages.length)throw Error('This PDF contains no readable pages.');
 const lines=buildLines(pages),text=lines.map(line=>line.text).join('\n'),warnings=[];
 if(text.replace(/\s/g,'').length<15)throw Error('This PDF has no readable text. Scanned or photographed invoices need OCR before import; use a text PDF or enter the invoice manually.');
 const supplier=findHeading(lines,SUPPLIER),customer=findHeading(lines,CUSTOMER);
 const fields={...readParty(partyLines(lines,supplier,customer,'supplier'),'supplier'),...readParty(partyLines(lines,customer,supplier,'customer'),'customer')};
 fields.number=fieldValue(lines,/\b(?:cislo\s+faktury|invoice\s*(?:number|no\.?|#))\b/,/\b[A-Z0-9][A-Z0-9._/-]{1,39}\b/i);
 if(!/\d/.test(fields.number))fields.number='';
 if(!fields.number){fields.number=fieldValue(lines,/\b(?:faktura|invoice)\b/,/\b[A-Z0-9][A-Z0-9._/-]{1,39}\b/i,false);if(!/\d/.test(fields.number))fields.number='';}
 const dates={issueDate:/\b(?:datum\s+vystavenia|issue\s+date|date\s+of\s+issue|invoice\s+date)\b/,deliveryDate:/\b(?:datum\s+dodania|delivery\s+date|date\s+of\s+delivery|tax\s+date)\b/,dueDate:/\b(?:datum\s+splatnosti|due\s+date|payment\s+due)\b/};
 for(const [key,label] of Object.entries(dates))fields[key]=parseDate(fieldValue(lines,label,DATE_RE));
 fields.orderNumber=fieldValue(lines,/\b(?:cislo\s+objednavky|objednavka|order\s*(?:number|no\.?|#)|purchase\s+order|po\s*number)\b/,/\b[A-Z0-9][A-Z0-9._/-]{0,49}\b/i);
 let iban=fieldValue(lines,/\biban\b/,/\b[A-Z]{2}\d{2}(?:\s*[A-Z0-9]){11,30}\b/);
 iban=iban.replace(/\s/g,'');const lengths={SK:24,CZ:24,DE:22,AT:20,GB:22,RS:22,FR:27,NL:18,IT:27,PL:28,HU:28,BE:16,CH:21,ES:24,IE:22,PT:25};if(lengths[iban.slice(0,2)])iban=iban.slice(0,lengths[iban.slice(0,2)]);fields.iban=iban;
 fields.swift=fieldValue(lines,/\b(?:swift(?:\s*\/\s*bic)?|bic)\b/,/\b[A-Z]{6}[A-Z0-9]{2}(?:[A-Z0-9]{3})?\b/);
 fields.variableSymbol=fieldValue(lines,/\b(?:variabilny(?:\s+symbol)?|variable\s+symbol|payment\s+reference)\b/,/\b\d{1,20}\b/);
 fields.constantSymbol=fieldValue(lines,/\b(?:konstantny(?:\s+symbol)?|constant\s+symbol)\b/,/\b\d{1,10}\b/);
 fields.paymentMethod=fieldValue(lines,/\b(?:sposob\s+platby|forma\s+uhrady|payment\s+method|uhrada)\b/,/\b(?:Prevodom|Bank\s+transfer|Wire\s+transfer|Cash|Hotovos\u0165)\b/i,false);
 fields.language=/\b(?:faktura|dodavatel|odberatel)\b/.test(fold(text))?'sk':'en';
 const currency=(text.match(/\b(?:USD|GBP|CZK|CHF|PLN)\b|\$|\u00a3|K\u010d/g)||[])[0];if(currency)throw Error('This invoice appears to use '+currency+'. Velto currently supports EUR invoices; review it manually instead of converting the amount automatically.');
 const total=readTotal(lines),items=readItems(lines,pages,warnings);
 if(!fields.number)warnings.push('Invoice number was not found. Enter the original invoice number.');
 if(!fields.supplierName)warnings.push('Supplier details could not be identified. Fill them in from the PDF.');
 if(!fields.customerName)warnings.push('Customer details could not be identified. Fill them in from the PDF.');
 if(!fields.issueDate)warnings.push('Issue date was not found or is invalid. Enter the original date.');
 if(!fields.dueDate)warnings.push('Due date was not found or is invalid. Check the payment date.');
 if(!items.length)warnings.push('Line items could not be read. Enter them manually; no amount has been guessed.');
 if(fields.supplierVatPayer&&items.some(item=>!item.vatRate))warnings.push('The supplier has a VAT ID, but a VAT rate could not be confirmed for every line. Review the VAT checkbox and rates.');
 let computed=0;for(const item of items){const net=Math.round(item.quantity*item.unitPrice*100)/100;computed+=net+(fields.supplierVatPayer?Math.round(net*item.vatRate)/100:0);}computed=Math.round(computed*100)/100;
 if(total!==null&&items.length&&Math.abs(total-computed)>0.02)warnings.push('The imported line total does not match the PDF total. Check quantities, prices and VAT before saving.');
 if(total===null)warnings.push('The final PDF total could not be confirmed. Check the total before saving.');
 return {fields,items,total,warnings:[...new Set(warnings)],text,fileName:clean(fileName),pageCount:pages.length};
}
function overlayOpen(){return !!global.document?.getElementById('overlay')?.classList.contains('show');}
function dataStore(){return typeof db!=='undefined'?db:global.db;}
function importSession(){
 const hosted=global.VELTO_HOSTED===true||(typeof global.isVeltoHosted==='function'&&global.isVeltoHosted());
 const access=typeof global.iDropboxAccess==='function'?global.iDropboxAccess():null;
 const localGate=!hosted&&typeof global.submitVeltoLogin==='function';
 return {hosted,authenticated:!!global.veltoCloudAuthenticated,accountId:String(access?.accountId||''),localGate,localAuthenticated:!!global.document?.body?.classList?.contains('authenticated')};
}
function sameSession(start){const current=importSession();return current.hosted===start.hosted&&(!start.hosted||start.authenticated&&current.authenticated&&!!start.accountId&&start.accountId===current.accountId)&&(!start.localGate||start.localAuthenticated&&current.localAuthenticated);} 
function notify(message){if(typeof global.toast==='function')global.toast(message);}
function openImported(result,session=importSession()){
 if(!sameSession(session)){notify('Sign in again, then import the PDF.');return false;}
 if(overlayOpen()){notify('Finish or cancel the current entry before importing an invoice.');return false;}
 const draft=global.iBlank();
 for(const prefix of ['supplier','customer'])for(const field of ['Name','Address','Country','Ico','Dic','VatId','Email','Phone'])draft[prefix+field]='';
 Object.assign(draft,{number:'',issueDate:'',deliveryDate:'',dueDate:'',orderNumber:'',iban:'',swift:'',variableSymbol:'',constantSymbol:'',paymentMethod:'',paymentTerms:'',lateInterest:'',footer:'',customerId:'',supplierVatPayer:false,vatPayer:false,status:'draft',items:[]},result.fields);
 draft.vatPayer=!!draft.supplierVatPayer;draft.items=result.items.length?structuredClone(result.items):[{description:'',quantity:1,unitPrice:0,vatRate:0}];
 const matchedCustomer=typeof global.iFindImportedCustomer==='function'?global.iFindImportedCustomer(draft):null;if(matchedCustomer)draft.customerId=matchedCustomer.id;
 global.invoiceDraft=draft;global.invoiceModal('',false,true);
 const modal=global.document.getElementById('modal');if(!modal)return true;
 const heading=modal.querySelector('.modalhead h2');if(heading)heading.textContent='Review old invoice'+(draft.number?' - '+draft.number:'');
 if(!(dataStore()?.invoices||[]).some(invoice=>invoice.id===draft.id))modal.querySelector('.invoice-modal-actions .btn.danger')?.remove();
 const notice=global.document.createElement('section');notice.id='invoiceImportReview';notice.className='card';notice.style.cssText='margin:0 0 18px;padding:15px;border-color:var(--blue);box-shadow:none';
 const title=global.document.createElement('b');title.textContent='Imported PDF - review before saving';notice.append(title);
 const intro=global.document.createElement('p');intro.className='card-sub';intro.textContent='No changes have been saved. Check the original number, dates, company details, items and total, then save the invoice.';notice.append(intro);
 if(result.total!==null){const amount=global.document.createElement('p');amount.textContent='Total read from PDF: '+global.iMoney(result.total);notice.append(amount);}
 const warnings=[...result.warnings];if(matchedCustomer)warnings.push('An existing saved customer was matched. Its saved details will be kept; the PDF details apply to this invoice.');if((dataStore()?.invoices||[]).some(invoice=>invoice.number===draft.number))warnings.push('An invoice with this number already exists. Check for a duplicate before saving.');
 if(warnings.length){const list=global.document.createElement('ul');for(const warning of warnings){const row=global.document.createElement('li');row.textContent=warning;row.style.marginBottom='5px';list.append(row);}notice.append(list);}
 const details=global.document.createElement('details'),summary=global.document.createElement('summary'),extracted=global.document.createElement('pre');summary.textContent='Show extracted PDF text';extracted.textContent=result.text.slice(0,200000);extracted.style.cssText='white-space:pre-wrap;overflow-wrap:anywhere;max-height:180px;overflow:auto;font:12px/1.5 monospace';details.append(summary,extracted);notice.append(details);
 const due=global.document.getElementById('iv_dueDate');if(due&&draft.dueDate)due.dataset.manual='1';
 modal.querySelector('.invoice-editor')?.before(notice);global.invoiceImportDraftId=draft.id;
 return true;
}
async function importFile(file){
 if(importing){notify('An invoice PDF is already being read.');return false;}
 if(overlayOpen()){notify('Finish or cancel the current entry before importing an invoice.');return false;}
 const session=importSession();if(!sameSession(session)){notify('Sign in before importing an invoice.');return false;}
 importing=true;let task;
 try{
  if(!file||typeof file.arrayBuffer!=='function')throw Error('Choose an invoice PDF file.');
  if(file.size>MAX_BYTES)throw Error('Choose a PDF smaller than 20 MB.');
  const bytes=new Uint8Array(await file.arrayBuffer());if(bytes.length>MAX_BYTES)throw Error('Choose a PDF smaller than 20 MB.');
  const header=String.fromCharCode(...bytes.subarray(0,1024));if(!header.includes('%PDF-'))throw Error('That file is not a readable PDF.');
  notify('Reading invoice PDF...');
  const pdfjs=typeof global.getVeltoPdfJs==='function'?await global.getVeltoPdfJs():global.pdfjsLib;
  if(!pdfjs?.getDocument)throw Error('The PDF reader could not load. Reopen Velto and try again.');
  task=pdfjs.getDocument({data:bytes,isEvalSupported:false,useWorkerFetch:false,disableFontFace:true,useSystemFonts:true});
  const pdf=await task.promise;if(pdf.numPages>MAX_PAGES)throw Error('Import supports invoice PDFs up to 30 pages.');
  const pages=[];for(let number=1;number<=pdf.numPages;number++){
   const page=await pdf.getPage(number),viewport=page.getViewport({scale:1}),content=await page.getTextContent();
   pages.push({width:viewport.width,height:viewport.height,items:content.items});page.cleanup();
  }
  const result=parsePages(pages,{fileName:file.name||'invoice.pdf'});if(!sameSession(session)){notify('Your sign-in changed while reading the PDF. Sign in and import it again.');return false;}if(!result.fields.number&&!result.items.length&&result.total===null)throw Error('No invoice number, line items or total could be recognized. Enter this invoice manually.');if(overlayOpen()){notify('Finish or cancel the current entry, then import the PDF again.');return false;}
  const opened=openImported(result,session);if(opened)notify('PDF fields filled. Review the invoice before saving.');return opened;
 }catch(error){let message=String(error?.message||'The PDF could not be read.');if(error?.name==='PasswordException')message='This PDF is password protected. Save an unlocked copy and import it again.';notify(message);return false;}
 finally{try{if(task)await task.destroy();}catch{}importing=false;}
}
function picker(){
 if(importing)return notify('An invoice PDF is already being read.');
 if(overlayOpen())return notify('Finish or cancel the current entry before importing an invoice.');
 const input=global.document.createElement('input');input.type='file';input.accept='application/pdf,.pdf';input.hidden=true;global.document.body.append(input);
 input.addEventListener('change',()=>{const file=input.files?.[0];input.remove();if(file)importFile(file);},{once:true});input.addEventListener('cancel',()=>input.remove(),{once:true});input.click();
}
global.VeltoInvoiceImport={parsePages,parseNumber,parseDate,buildLines,openImported};
global.invoiceImportOld=picker;global.invoiceImportFile=importFile;
})(typeof window!=='undefined'?window:globalThis);
