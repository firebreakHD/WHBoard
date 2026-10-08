"use client";

import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, ExternalLink, Heart, LoaderCircle, Share2, X, ZoomIn, ZoomOut } from "lucide-react";

export type ProspectViewerRetailer = { id: string; name: string; url: string };
const imageFlyerRetailers = new Set(["hofer", "spar", "eurospar", "interspar", "billa", "billa-plus", "lidl", "penny", "dm", "bipa", "nahundfrisch"]);
type PageData = { image: string; pageCount: number; title: string };

export function ProspectViewer({ retailer, location, favorite, onFavorite, onClose, showFavorite=true }: {
  retailer: ProspectViewerRetailer;
  location: string;
  favorite: boolean;
  onFavorite: () => void;
  onClose: () => void;
  showFavorite?: boolean;
}) {
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [image, setImage] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [zoom, setZoom] = useState(0.9);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [direction, setDirection] = useState<"next" | "previous">("next");
  const [external, setExternal] = useState(false);
  const pageRef = useRef<HTMLElement>(null);
  const zoomRef = useRef(0.9);
  const panRef = useRef({ x: 0, y: 0 });
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const touchGesture = useRef<{ mode: "page" | "pan" | "pinch"; startX: number; startY: number; startDistance: number; startZoom: number; panX: number; panY: number } | null>(null);
  const gesture = useRef<
    | { mode: "page"; startX: number; startY: number }
    | { mode: "pan"; startX: number; startY: number; panX: number; panY: number }
    | { mode: "pinch"; startDistance: number; startZoom: number }
    | null
  >(null);
  const navigationLock = useRef(false);
  const zoomed = zoom > 1.001;

  function setZoomLevel(value: number) {
    const next = Math.max(0.7, Math.min(3, Math.round(value * 100) / 100));
    zoomRef.current = next;
    setZoom(next);
    if (next <= 1) { panRef.current = { x: 0, y: 0 }; setPan({ x: 0, y: 0 }); }
  }

  function setPanPosition(x: number, y: number, scale = zoomRef.current) {
    const bounds = pageRef.current?.getBoundingClientRect();
    const maxX = bounds ? bounds.width * (scale - 1) / 2 : 0;
    const maxY = bounds ? bounds.height * (scale - 1) / 2 : 0;
    const next = { x: Math.max(-maxX, Math.min(maxX, x)), y: Math.max(-maxY, Math.min(maxY, y)) };
    panRef.current = next;
    setPan(next);
  }

  function pointerDistance() {
    const [first, second] = [...pointers.current.values()];
    return first && second ? Math.hypot(first.x - second.x, first.y - second.y) : 0;
  }

  function pointerDown(event: ReactPointerEvent<HTMLElement>) {
    if (event.pointerType === "touch") return;
    if (event.pointerType === "mouse" && event.button !== 0) return;
    const point = { x: event.clientX, y: event.clientY };
    if(event.pointerType==="mouse"){try{event.currentTarget.setPointerCapture(event.pointerId)}catch{}}
    event.preventDefault();
    pointers.current.set(event.pointerId, point);
    if (pointers.current.size >= 2) {
      gesture.current = { mode: "pinch", startDistance: pointerDistance(), startZoom: zoomRef.current };
    } else if (zoomRef.current > 1.001) {
      gesture.current = { mode: "pan", startX: point.x, startY: point.y, panX: panRef.current.x, panY: panRef.current.y };
    } else {
      gesture.current = { mode: "page", startX: point.x, startY: point.y };
    }
  }

  function pointerMove(event: ReactPointerEvent<HTMLElement>) {
    if (event.pointerType === "touch") return;
    if (!pointers.current.has(event.pointerId)) return;
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    const current = gesture.current;
    if (pointers.current.size >= 2 && current?.mode === "pinch") {
      const distance = pointerDistance();
      if (current.startDistance > 0 && distance > 0) setZoomLevel(current.startZoom * distance / current.startDistance);
    } else if (pointers.current.size === 1 && current?.mode === "pan") {
      setPanPosition(current.panX + event.clientX - current.startX, current.panY + event.clientY - current.startY);
    }
  }

  function pointerEnd(event: ReactPointerEvent<HTMLElement>) {
    if (event.pointerType === "touch") return;
    const current = gesture.current;
    const origin = pointers.current.get(event.pointerId);
    if (current?.mode === "page" && origin) {
      const dx = event.clientX - current.startX;
      const dy = event.clientY - current.startY;
      if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.2) changePage(page + (dx < 0 ? 1 : -1));
    }
    pointers.current.delete(event.pointerId);
    if (pointers.current.size >= 2) gesture.current = { mode: "pinch", startDistance: pointerDistance(), startZoom: zoomRef.current };
    else if (pointers.current.size === 1 && zoomRef.current > 1.001) {
      const [remaining] = [...pointers.current.values()];
      gesture.current = { mode: "pan", startX: remaining.x, startY: remaining.y, panX: panRef.current.x, panY: panRef.current.y };
    } else if (pointers.current.size === 0) gesture.current = null;
  }

  useEffect(() => {
    const viewport = pageRef.current;
    if (!viewport) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      setZoomLevel(zoomRef.current + (event.deltaY < 0 ? 0.15 : -0.15));
    };
    viewport.addEventListener("wheel", onWheel, { passive: false });
    return () => viewport.removeEventListener("wheel", onWheel);
  }, [image]);

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
    setZoomLevel(0.9);
    setPanPosition(0, 0, 0.9);
    setDirection(next > page ? "next" : "previous");
    navigationLock.current = true;
    void loadPage(next).finally(() => { navigationLock.current = false; });
  }, [loadPage, loading, page, pageCount, zoomed]);

  useEffect(() => {
    const viewport = pageRef.current;
    if (!viewport) return;
    const distance = (touches: TouchList) => {
      if (touches.length < 2) return 0;
      return Math.hypot(touches[0].clientX - touches[1].clientX, touches[0].clientY - touches[1].clientY);
    };
    const onStart = (event: TouchEvent) => {
      if ((event.target as Element | null)?.closest("button")) return;
      if (event.touches.length >= 2) {
        touchGesture.current = { mode: "pinch", startX: 0, startY: 0, startDistance: distance(event.touches), startZoom: zoomRef.current, panX: panRef.current.x, panY: panRef.current.y };
      } else if (event.touches.length === 1) {
        const touch = event.touches[0];
        touchGesture.current = { mode: zoomRef.current > 1.001 ? "pan" : "page", startX: touch.clientX, startY: touch.clientY, startDistance: 0, startZoom: zoomRef.current, panX: panRef.current.x, panY: panRef.current.y };
      }
    };
    const onMove = (event: TouchEvent) => {
      const current = touchGesture.current;
      if (!current) return;
      if (event.touches.length >= 2) {
        event.preventDefault();
        if (current.mode !== "pinch") {
          current.mode = "pinch";
          current.startDistance = distance(event.touches);
          current.startZoom = zoomRef.current;
        } else if (current.startDistance > 0) setZoomLevel(current.startZoom * distance(event.touches) / current.startDistance);
        return;
      }
      if (event.touches.length === 1 && current.mode === "pan") {
        event.preventDefault();
        const touch = event.touches[0];
        setPanPosition(current.panX + touch.clientX - current.startX, current.panY + touch.clientY - current.startY);
      }
    };
    const onEnd = (event: TouchEvent) => {
      const current = touchGesture.current;
      if (!current) return;
      if (event.touches.length >= 2) return;
      if (event.touches.length === 1) {
        const touch = event.touches[0];
        touchGesture.current = { ...current, mode: zoomRef.current > 1.001 ? "pan" : "page", startX: touch.clientX, startY: touch.clientY, startDistance: 0, startZoom: zoomRef.current, panX: panRef.current.x, panY: panRef.current.y };
        return;
      }
      if (current.mode === "page" && current.startZoom <= 1.001 && event.changedTouches.length) {
        const touch = event.changedTouches[0];
        const dx = touch.clientX - current.startX;
        const dy = touch.clientY - current.startY;
        if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.2) changePage(page + (dx < 0 ? 1 : -1));
      }
      touchGesture.current = null;
    };
    viewport.addEventListener("touchstart", onStart, { passive: true });
    viewport.addEventListener("touchmove", onMove, { passive: false });
    viewport.addEventListener("touchend", onEnd, { passive: true });
    viewport.addEventListener("touchcancel", onEnd, { passive: true });
    return () => {
      viewport.removeEventListener("touchstart", onStart);
      viewport.removeEventListener("touchmove", onMove);
      viewport.removeEventListener("touchend", onEnd);
      viewport.removeEventListener("touchcancel", onEnd);
    };
  }, [changePage, page]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.repeat) return;
      if (event.key === "+" || event.key === "=") { event.preventDefault(); setZoomLevel(zoomRef.current + 0.25); }
      if (event.key === "-" || event.key === "_") { event.preventDefault(); setZoomLevel(zoomRef.current - 0.25); }
      if (event.key === "ArrowLeft") { event.preventDefault(); changePage(page - 1); }
      if (event.key === "ArrowRight") { event.preventDefault(); changePage(page + 1); }
    };
    window.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = previousOverflow; };
  }, [changePage, onClose, page]);

  useEffect(() => {
    document.body.classList.add("prospect-viewer-open");
    return () => document.body.classList.remove("prospect-viewer-open");
  }, []);

  async function share() {
    const shareData = { title: `${retailer.name} Prospekt`, url: retailer.url };
    if (navigator.share) { try { await navigator.share(shareData); return; } catch { /* user closed share sheet */ } }
    try { await navigator.clipboard.writeText(retailer.url); } catch { window.open(retailer.url, "_blank", "noopener,noreferrer"); }
  }

  const viewer = <div className="prospect-viewer-scrim" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="prospect-viewer" role="dialog" aria-modal="true" aria-label={`${retailer.name} Prospekt`}>
      <header className="prospect-viewer-header">
        <button className="prospect-viewer-icon prospect-viewer-close" onClick={onClose} aria-label="Schließen"><X size={24}/></button>
        <div className="prospect-viewer-title"><b>{retailer.name}</b><small>{external ? "Offizielle Prospektseite" : "Aktuelles Flugblatt"}</small></div>
        <div className="prospect-viewer-actions">
          <button className="prospect-viewer-icon" onClick={() => void share()} aria-label="Prospekt teilen"><Share2 size={21}/></button>
          {showFavorite&&<button className={`prospect-viewer-icon ${favorite ? "is-favorite" : ""}`} onClick={onFavorite} aria-label="Favorit umschalten" aria-pressed={favorite}><Heart size={22} fill={favorite ? "currentColor" : "none"}/></button>}
        </div>
      </header>
      {external ? <div className="prospect-viewer-fallback"><div className="prospect-viewer-fallback-copy"><b>Prospekt direkt beim Händler öffnen</b><span>Für diesen Händler ist kein frei zugänglicher Bildseiten-Feed verfügbar.</span><a className="button button-primary" href={retailer.url} target="_blank" rel="noreferrer">Offizielle Quelle öffnen <ExternalLink size={15}/></a></div></div> : <>
        <main ref={pageRef} className={`prospect-viewer-page ${zoomed ? "is-zoomed" : ""}`} onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerEnd} onPointerCancel={pointerEnd}>
          {loading ? <div className="prospect-viewer-loading"><LoaderCircle size={24} className="prospect-viewer-spinner"/><span>Seite wird geladen …</span></div> : error ? <div className="prospect-viewer-loading prospect-viewer-error"><span>{error}</span><a className="button button-secondary" href={retailer.url} target="_blank" rel="noreferrer">Originalprospekt öffnen <ExternalLink size={14}/></a></div> : <img key={image} className={`prospect-flyer-image slide-${direction}`} style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }} src={image} alt={`${retailer.name} Prospektseite ${page}`} draggable={false} />}
          {!external && !loading && !error && <div className="prospect-viewer-zoom-controls" onPointerDown={event=>event.stopPropagation()}><button onClick={()=>setZoomLevel(zoomRef.current-.25)} disabled={zoom<=0.701} aria-label="Ansicht verkleinern"><ZoomOut size={18}/></button><span>{Math.round(zoom*100)}%</span><button onClick={()=>setZoomLevel(zoomRef.current+.25)} disabled={zoom>=2.99} aria-label="Ansicht vergrößern"><ZoomIn size={18}/></button></div>}
        </main>
        <nav className="prospect-viewer-pagination" aria-label="Prospektseiten">
          <button onClick={() => changePage(page - 1)} disabled={page <= 1 || loading} aria-label="Vorherige Seite"><ChevronLeft size={23}/></button>
          <span>{page} / {pageCount}</span>
          <button onClick={() => changePage(page + 1)} disabled={page >= pageCount || loading} aria-label="Nächste Seite"><ChevronRight size={23}/></button>
        </nav>
      </>}
    </section>
  </div>;
  return typeof document === "undefined" ? null : createPortal(viewer, document.body);
}
