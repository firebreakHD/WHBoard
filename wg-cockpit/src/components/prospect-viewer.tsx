"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, ExternalLink, Heart, LoaderCircle, Share2, X, ZoomIn, ZoomOut } from "lucide-react";

export type ProspectViewerRetailer = { id: string; name: string; url: string };
const imageFlyerRetailers = new Set(["hofer", "spar", "eurospar", "interspar", "billa", "billa-plus", "lidl", "penny", "dm", "bipa"]);
type PageData = { image: string; pageCount: number; title: string };

export function ProspectViewer({ retailer, location, favorite, onFavorite, onClose }: {
  retailer: ProspectViewerRetailer;
  location: string;
  favorite: boolean;
  onFavorite: () => void;
  onClose: () => void;
}) {
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [image, setImage] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [zoomed, setZoomed] = useState(false);
  const [direction, setDirection] = useState<"next" | "previous">("next");
  const [external, setExternal] = useState(false);
  const start = useRef<{ x: number; y: number } | null>(null);
  const navigationLock = useRef(false);

  const loadPage = useCallback(async (nextPage: number): Promise<number | null> => {
  if (!imageFlyerRetailers.has(retailer.id)) {
      setExternal(true);
      setLoading(false);
      return null;
    }
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/prospekte?retailer=${encodeURIComponent(retailer.id)}&page=${nextPage}&location=${encodeURIComponent(location)}`, { cache: "force-cache" });
      const result = await response.json() as PageData & { error?: string };
      if (!response.ok || !result.image) throw new Error(result.error || "Prospektseite konnte nicht geladen werden.");
      setImage(result.image);
      setPageCount(result.pageCount);
      setPage(nextPage);
      setExternal(false);
      return result.pageCount;
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : "Prospektseite konnte nicht geladen werden.");
      return null;
    } finally {
      setLoading(false);
    }
  }, [location, retailer.id]);

  useEffect(() => {
    const saved = Number(localStorage.getItem(`prospekt-page:${retailer.id}`) || "1");
    void (async () => {
      const count = await loadPage(1);
      if (count && Number.isInteger(saved) && saved > 1 && saved <= count) await loadPage(saved);
    })();
  }, [loadPage, retailer.id]);

  useEffect(() => {
    if (imageFlyerRetailers.has(retailer.id)) localStorage.setItem(`prospekt-page:${retailer.id}`, String(page));
  }, [page, retailer.id]);

  const changePage = useCallback((next: number) => {
    if (loading || navigationLock.current || zoomed || next < 1 || next > pageCount || next === page) return;
    setDirection(next > page ? "next" : "previous");
    navigationLock.current = true;
    void loadPage(next).finally(() => { navigationLock.current = false; });
  }, [loadPage, loading, page, pageCount, zoomed]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.repeat) return;
      if (event.key === "ArrowLeft") { event.preventDefault(); changePage(page - 1); }
      if (event.key === "ArrowRight") { event.preventDefault(); changePage(page + 1); }
    };
    window.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = previousOverflow; };
  }, [changePage, onClose, page]);

  async function share() {
    const shareData = { title: `${retailer.name} Prospekt`, url: retailer.url };
    if (navigator.share) { try { await navigator.share(shareData); return; } catch { /* user closed share sheet */ } }
    try { await navigator.clipboard.writeText(retailer.url); } catch { window.open(retailer.url, "_blank", "noopener,noreferrer"); }
  }

  return <div className="prospect-viewer-scrim" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="prospect-viewer" role="dialog" aria-modal="true" aria-label={`${retailer.name} Prospekt`}>
      <header className="prospect-viewer-header">
        <button className="prospect-viewer-icon prospect-viewer-close" onClick={onClose} aria-label="Schließen"><X size={24}/></button>
        <div className="prospect-viewer-title"><b>{retailer.name}</b><small>{external ? "Offizielle Prospektseite" : "Aktuelles Flugblatt"}</small></div>
        <div className="prospect-viewer-actions">
          <button className="prospect-viewer-icon" onClick={() => void share()} aria-label="Prospekt teilen"><Share2 size={21}/></button>
          <button className={`prospect-viewer-icon ${favorite ? "is-favorite" : ""}`} onClick={onFavorite} aria-label="Favorit umschalten" aria-pressed={favorite}><Heart size={22} fill={favorite ? "currentColor" : "none"}/></button>
        </div>
      </header>
      {external ? <div className="prospect-viewer-fallback"><div className="prospect-viewer-fallback-copy"><b>Prospekt direkt beim Händler öffnen</b><span>Für diesen Händler ist kein frei zugänglicher Bildseiten-Feed verfügbar.</span><a className="button button-primary" href={retailer.url} target="_blank" rel="noreferrer">Offizielle Quelle öffnen <ExternalLink size={15}/></a></div></div> : <>
        <main className={`prospect-viewer-page ${zoomed ? "is-zoomed" : ""}`} onTouchStart={event => { if (!zoomed) start.current = { x: event.touches[0].clientX, y: event.touches[0].clientY }; }} onTouchEnd={event => {
          const origin = start.current; start.current = null; if (!origin || zoomed) return;
          const dx = event.changedTouches[0].clientX - origin.x; const dy = event.changedTouches[0].clientY - origin.y;
          if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.2) changePage(page + (dx < 0 ? 1 : -1));
        }}>
          {loading ? <div className="prospect-viewer-loading"><LoaderCircle size={24} className="prospect-viewer-spinner"/><span>Seite wird geladen …</span></div> : error ? <div className="prospect-viewer-loading prospect-viewer-error"><span>{error}</span><a className="button button-secondary" href={retailer.url} target="_blank" rel="noreferrer">Originalprospekt öffnen <ExternalLink size={14}/></a></div> : <img key={image} className={`prospect-flyer-image slide-${direction}`} src={image} alt={`${retailer.name} Prospektseite ${page}`} draggable={false} />}
          {!external && !loading && !error && <button className="prospect-viewer-zoom" onClick={() => setZoomed(value => !value)} aria-label={zoomed ? "Ansicht verkleinern" : "Ansicht vergrößern"}>{zoomed ? <ZoomOut size={19}/> : <ZoomIn size={19}/>}</button>}
        </main>
        <nav className="prospect-viewer-pagination" aria-label="Prospektseiten">
          <button onClick={() => changePage(page - 1)} disabled={page <= 1 || loading} aria-label="Vorherige Seite"><ChevronLeft size={23}/></button>
          <span>{page} / {pageCount}</span>
          <button onClick={() => changePage(page + 1)} disabled={page >= pageCount || loading} aria-label="Nächste Seite"><ChevronRight size={23}/></button>
        </nav>
      </>}
    </section>
  </div>;
}
