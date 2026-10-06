"use client";

import {useState} from "react";
import {createPortal} from "react-dom";
import {Receipt,X} from "lucide-react";

export type PurchaseLog={store:string;buyer:string;items:{name:string;qty:string;price:number|null;icon:string}[];receiptId?:string;receiptName?:string;receiptType?:string};
export type PurchaseLogRecord={title:string;amount:number;date:string;purchase:PurchaseLog};

export function PurchaseLogDialog({record,onClose,layout="tiles"}:{record:PurchaseLogRecord|null;onClose:()=>void;layout?:"tiles"|"list"}){
 const [showReceipt,setShowReceipt]=useState(false);
 if(!record||typeof document==="undefined")return null;
 return createPortal(<>
  <div className="purchase-detail-scrim" onMouseDown={event=>{if(event.target===event.currentTarget)onClose()}}><section className="purchase-detail-dialog" role="dialog" aria-modal="true" aria-label="Einkaufsprotokoll">
   <header><div><small>{record.purchase.store} · {record.purchase.buyer} · {record.date}</small><h2>{record.title}</h2></div><button className="close-button" onClick={onClose} aria-label="Schließen"><X size={19}/></button></header>
   <div className="purchase-detail-total"><span>Gesamtbetrag</span><strong>{new Intl.NumberFormat("de-AT",{style:"currency",currency:"EUR"}).format(record.amount)}</strong></div>
   <div className={`purchase-detail-items ${layout==="list"?"purchase-detail-items-list":""}`}>{record.purchase.items.map((item,index)=><article className="purchase-detail-item" key={`${item.name}-${index}`}><span>{item.icon||"🛒"}</span><div><b>{item.name}</b><small>{item.qty}</small></div>{item.price!==null&&<strong>{new Intl.NumberFormat("de-AT",{style:"currency",currency:"EUR"}).format(item.price)}</strong>}</article>)}{!record.purchase.items.length&&<p className="empty-state">Keine einzelnen Artikel gespeichert.</p>}</div>
   {record.purchase.receiptId&&<button className="button button-secondary purchase-receipt-open" onClick={()=>setShowReceipt(true)}><Receipt size={16}/> Kassenzettel anzeigen</button>}
  </section></div>
  {showReceipt&&record.purchase.receiptId&&<div className="purchase-receipt-scrim" onMouseDown={event=>{if(event.target===event.currentTarget)setShowReceipt(false)}}><section className="purchase-receipt-dialog" role="dialog" aria-modal="true" aria-label="Kassenzettel"><header><b>{record.purchase.receiptName||"Kassenzettel"}</b><button className="close-button" onClick={()=>setShowReceipt(false)} aria-label="Schließen"><X size={19}/></button></header><img src={`/api/receipts/${encodeURIComponent(record.purchase.receiptId)}`} alt="Gespeicherter Kassenzettel"/><button className="button button-secondary" onClick={()=>setShowReceipt(false)}>Schließen</button></section></div>}
 </>,document.body);
}
