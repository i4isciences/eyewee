"use client";

// Client-side PDF text extraction for the Document Search upload feature. Runs entirely in the
// browser -- the file never leaves the device. Worker is loaded from a version-pinned CDN URL
// (matching the installed pdfjs-dist version exactly) rather than bundled, since wiring up
// pdf.js's worker through Next/Turbopack's bundler is fragile across versions; a pinned CDN URL
// is simple and reliable.
export async function extractPdfText(file: File): Promise<string> {
  const pdfjsLib = await import("pdfjs-dist");
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  const pageTexts: string[] = [];
  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    const pageText = content.items.map((item) => ("str" in item ? item.str : "")).join(" ");
    pageTexts.push(pageText);
  }

  return pageTexts.join("\n\n");
}
