"use client";

import type { ReactNode } from "react";

// Lightweight, dependency-free, injection-safe renderer for the handful of formatting marks
// eyewee's replies actually use -- **bold**, "- "/"* " bullet lists, and [text](url) links.
// Deliberately not a general markdown parser (no headings, tables, code fences, raw HTML): eyewee
// doesn't need them, and keeping the surface this small means every node is built directly as
// React elements -- never dangerouslySetInnerHTML -- so there's no HTML-injection surface here
// regardless of what the model outputs.
function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern = /\*\*(.+?)\*\*|\[([^\]]+)\]\(([^)]+)\)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let i = 0;

  while ((match = pattern.exec(text))) {
    if (match.index > lastIndex) nodes.push(text.slice(lastIndex, match.index));
    if (match[1] !== undefined) {
      nodes.push(<strong key={`${keyPrefix}-b${i}`}>{match[1]}</strong>);
    } else {
      const href = match[3];
      nodes.push(
        <a key={`${keyPrefix}-l${i}`} href={href} target={href.startsWith("/") ? undefined : "_blank"} rel="noreferrer">
          {match[2]}
        </a>
      );
    }
    lastIndex = pattern.lastIndex;
    i++;
  }
  if (lastIndex < text.length) nodes.push(text.slice(lastIndex));
  return nodes;
}

function isBulletLine(line: string): boolean {
  return /^[-*]\s+/.test(line.trim());
}

export function MarkdownLite({ text }: { text: string }) {
  const blocks = text.split(/\n{2,}/);

  return (
    <>
      {blocks.map((block, blockIndex) => {
        const lines = block.split("\n").filter((line) => line.trim());
        if (lines.length === 0) return null;

        if (lines.every(isBulletLine)) {
          return (
            <ul key={blockIndex} className="persona-bubble-list">
              {lines.map((line, i) => (
                <li key={i}>{renderInline(line.trim().replace(/^[-*]\s+/, ""), `${blockIndex}-${i}`)}</li>
              ))}
            </ul>
          );
        }

        return (
          <p key={blockIndex} className="persona-bubble-para">
            {lines.map((line, i) => (
              <span key={i}>
                {renderInline(line, `${blockIndex}-${i}`)}
                {i < lines.length - 1 && <br />}
              </span>
            ))}
          </p>
        );
      })}
    </>
  );
}
