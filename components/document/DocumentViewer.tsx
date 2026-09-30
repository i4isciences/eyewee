"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { FindBar } from "@/components/document/FindBar";
import { useDocumentFind } from "@/lib/eyewee/search/useDocumentFind";

// Wraps a single rendered document with an in-app find bar (docs/DEVELOPMENT_PLAN.md §6.8).
// Works over any real, selectable DOM content -- this is deliberately not a PDF viewer. When a
// PDF.js-based viewer is chosen for wherever postdocs actually read papers, its text-layer feature
// must be turned on (off by default) for both this find bar and native Ctrl+F to find anything;
// see the module comment in lib/eyewee/search/useDocumentFind.ts.
export function DocumentViewer({ title, meta, children }: { title: string; meta?: string; children: ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const find = useDocumentFind(containerRef);

  const close = () => {
    setOpen(false);
    find.clear();
  };

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "f") {
        // Native browser find still works underneath -- this just surfaces the in-app bar too.
        event.preventDefault();
        setOpen(true);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div className="docviewer">
      <div className="docviewer-topbar">
        <div className="docviewer-brand">
          eyewee <span>· Document</span>
        </div>
        <button type="button" className="docviewer-search-toggle" onClick={() => (open ? close() : setOpen(true))}>
          🔍 Search
        </button>
      </div>

      <FindBar
        open={open}
        term={find.term}
        count={find.count}
        currentIndex={find.currentIndex}
        onChange={find.search}
        onNext={find.next}
        onPrev={find.prev}
        onClose={close}
      />

      <div className="docviewer-body" ref={containerRef}>
        <h1 className="docviewer-title">{title}</h1>
        {meta && <p className="docviewer-meta">{meta}</p>}
        {children}
      </div>
    </div>
  );
}
