import type { ReactNode } from "react";
export function Panel({children,className=""}:{children:ReactNode;className?:string}){return <section className={`panel ${className}`}>{children}</section>}
export function SectionTitle({title,description}:{title:string;description?:string}){return <div className="section-title"><h2>{title}</h2>{description&&<p>{description}</p>}</div>}
export function PageHeading({title,subtitle,eyebrow,action}:{title:string;subtitle?:string;eyebrow?:string;action?:ReactNode}){return <div className="page-heading"><div>{eyebrow&&<div className="eyebrow">{eyebrow}</div>}<h1>{title}</h1>{subtitle&&<p>{subtitle}</p>}</div>{action}</div>}
export function Pill({children,tone="neutral"}:{children:ReactNode;tone?:string}){return <span className={`pill ${tone}`}>{children}</span>}
