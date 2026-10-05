import { Activity, Bell, Box, HardDrive, Network, Settings, Server, Wrench } from "lucide-react";

const groups = [
  { label: "ÜBERBLICK", tabs: [{ label: "Übersicht", href: "/", icon: Activity }] },
  { label: "BETRIEB", tabs: [
    { label: "Pipeline", href: "/docker", icon: Box },
    { label: "System", href: "/server", icon: Server },
    { label: "Benachrichtigungen", href: "/logs", icon: Bell },
    { label: "Wartung", href: "/einstellungen?view=wartung", icon: Wrench },
  ] },
  { label: "QUALITÄT", tabs: [
    { label: "Home Assistant", href: "/home-assistant", icon: Activity },
    { label: "Netzwerk", href: "/netzwerk", icon: Network },
    { label: "NAS", href: "/nas", icon: HardDrive },
  ] },
  { label: "VERWALTUNG", tabs: [{ label: "Verbindung", href: "/einstellungen?view=verbindung", icon: Settings }] },
];

export function AdminTabs({ active, status, refreshHref }: { active: string; status: string; refreshHref: string }) {
  return <>
    <div className="admin-brand-row"><span className="admin-brand">ADMIN COCKPIT</span><span className="admin-context">System Admin</span><span className="admin-context">{status}</span><a className="refresh" href={refreshHref}>Aktualisieren</a></div>
    <nav className="admin-tab-groups" aria-label="Admin Bereiche" role="tablist">
      {groups.map(group => <section className="admin-tab-group" key={group.label}>
        <b>{group.label}</b><div>{group.tabs.map(tab => <a role="tab" aria-selected={active === tab.href} className={`admin-tab ${active === tab.href ? "active" : ""}`} key={tab.href + tab.label} href={tab.href}><tab.icon size={15}/>{tab.label}</a>)}</div>
      </section>)}
    </nav>
  </>;
}
