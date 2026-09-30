"use client";

import { useCallback, useRef, useState } from "react";

// In-document find -- docs/DEVELOPMENT_PLAN.md §6.8 / §7. Plain regex-over-text-nodes, wrap hits
// in <mark>, scrollIntoView to jump. No search-index/paid API needed for a single open document --
// ported from the reference demo (eyewee_document_search_demo.html) as a reusable hook instead of
// the original's direct-innerHTML-swap script, so it composes with React-owned content.
//
// The PDF.js catch (docs/DEVELOPMENT_PLAN.md §6.8): this hook only finds real, selectable DOM
// text. A canvas-rendered PDF page has none -- if/when a PDF.js-based viewer is chosen, its text
// layer feature must be enabled for this (and native Ctrl+F) to find anything at all.

function escapeRegExp(term: string) {
  return term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function useDocumentFind(containerRef: React.RefObject<HTMLElement | null>) {
  const [term, setTerm] = useState("");
  const [count, setCount] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const originalHtmlRef = useRef<string | null>(null);
  const matchesRef = useRef<HTMLElement[]>([]);

  const clear = useCallback(() => {
    const container = containerRef.current;
    if (container && originalHtmlRef.current !== null) container.innerHTML = originalHtmlRef.current;
    matchesRef.current = [];
    setCount(0);
    setCurrentIndex(-1);
  }, [containerRef]);

  const highlight = useCallback((index: number) => {
    matchesRef.current.forEach((m) => m.classList.remove("find-hit-current"));
    const match = matchesRef.current[index];
    if (!match) return;
    match.classList.add("find-hit-current");
    match.scrollIntoView({ behavior: "smooth", block: "center" });
  }, []);

  const search = useCallback(
    (nextTerm: string) => {
      setTerm(nextTerm);
      const container = containerRef.current;
      if (!container) return;

      if (originalHtmlRef.current === null) originalHtmlRef.current = container.innerHTML;
      else container.innerHTML = originalHtmlRef.current;
      matchesRef.current = [];

      const trimmed = nextTerm.trim();
      if (!trimmed) {
        setCount(0);
        setCurrentIndex(-1);
        return;
      }

      const pattern = new RegExp(escapeRegExp(trimmed), "gi");
      const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
      const textNodes: Text[] = [];
      let node: Node | null;
      while ((node = walker.nextNode())) textNodes.push(node as Text);

      for (const textNode of textNodes) {
        const text = textNode.nodeValue ?? "";
        pattern.lastIndex = 0;
        if (!pattern.test(text)) continue;
        pattern.lastIndex = 0;

        const fragment = document.createDocumentFragment();
        let lastIndex = 0;
        let match: RegExpExecArray | null;
        while ((match = pattern.exec(text))) {
          fragment.appendChild(document.createTextNode(text.slice(lastIndex, match.index)));
          const mark = document.createElement("mark");
          mark.className = "find-hit";
          mark.textContent = match[0];
          fragment.appendChild(mark);
          matchesRef.current.push(mark);
          lastIndex = match.index + match[0].length;
        }
        fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
        textNode.parentNode?.replaceChild(fragment, textNode);
      }

      setCount(matchesRef.current.length);
      if (matchesRef.current.length > 0) {
        setCurrentIndex(0);
        highlight(0);
      } else {
        setCurrentIndex(-1);
      }
    },
    [containerRef, highlight]
  );

  const next = useCallback(() => {
    if (matchesRef.current.length === 0) return;
    setCurrentIndex((prev) => {
      const nextIndex = (prev + 1) % matchesRef.current.length;
      highlight(nextIndex);
      return nextIndex;
    });
  }, [highlight]);

  const prev = useCallback(() => {
    if (matchesRef.current.length === 0) return;
    setCurrentIndex((prevIndex) => {
      const nextIndex = (prevIndex - 1 + matchesRef.current.length) % matchesRef.current.length;
      highlight(nextIndex);
      return nextIndex;
    });
  }, [highlight]);

  return { term, count, currentIndex, search, next, prev, clear };
}
