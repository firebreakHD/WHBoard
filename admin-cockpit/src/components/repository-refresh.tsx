"use client";

import {useState} from "react";
import {RefreshCw} from "lucide-react";

export function RepositoryRefresh(){
 const [busy,setBusy]=useState(false);const [message,setMessage]=useState("");
 async function refresh(){setBusy(true);setMessage("");try{const response=await fetch("/api/repository/refresh",{method:"POST",cache:"no-store"});const result=await response.json() as {error?:string};if(!response.ok)throw new Error(result.error||"Repository konnte nicht erneuert werden.");setMessage("Repository-Cache erneuert. Home Assistant kann jetzt nach dem neuen Add-on-Stand suchen.")}catch(error){setMessage(error instanceof Error?error.message:"Repository konnte nicht erneuert werden.")}finally{setBusy(false)}}
 return <div className="repository-refresh"><button className="refresh" disabled={busy} onClick={()=>void refresh()}><RefreshCw size={14}/>{busy?"Repository wird erneuert …":"Repository erneuern"}</button>{message&&<small role="status">{message}</small>}</div>
}
