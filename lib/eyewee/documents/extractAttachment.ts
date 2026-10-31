"use client";

import JSZip from "jszip";
import { extractPdfText } from "./extractPdfText";

export type AttachmentData = {
  name: string;
  size: number;
  type: "pdf" | "image" | "pptx" | "text" | "other";
  mimeType: string;
  extractedText?: string;
  base64?: string;
  previewUrl?: string;
};

const MAX_ATTACHMENT_BYTES = 25 * 1024 * 1024; // 25 MB

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // strip data:image/...;base64,
      const commaIndex = result.indexOf(",");
      resolve(commaIndex >= 0 ? result.slice(commaIndex + 1) : result);
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}

function cleanXmlText(xml: string): string {
  // Extract all text inside <a:t>...</a:t> tags
  const matches = xml.match(/<a:t[^>]*>([\s\S]*?)<\/a:t>/g);
  if (!matches) return "";
  return matches
    .map((tag) => tag.replace(/<\/?a:t[^>]*>/g, "").trim())
    .filter(Boolean)
    .join(" ");
}

export async function extractPptxText(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);

  // Find all slide XML files
  const slidePaths = Object.keys(zip.files).filter((path) =>
    /^ppt\/slides\/slide\d+\.xml$/i.test(path)
  );

  // Sort slides numerically: slide1.xml, slide2.xml, ...
  slidePaths.sort((a, b) => {
    const numA = parseInt(a.match(/slide(\d+)\.xml/i)?.[1] ?? "0", 10);
    const numB = parseInt(b.match(/slide(\d+)\.xml/i)?.[1] ?? "0", 10);
    return numA - numB;
  });

  if (slidePaths.length === 0) {
    return "No slide text could be extracted from this PowerPoint presentation.";
  }

  const slideTexts: string[] = [];

  for (let i = 0; i < slidePaths.length; i++) {
    const slidePath = slidePaths[i];
    const slideXml = await zip.file(slidePath)?.async("text");
    if (!slideXml) continue;
    const text = cleanXmlText(slideXml);
    slideTexts.push(`--- Slide ${i + 1} ---\n${text || "(Empty or visual-only slide)"}`);
  }

  return `[PowerPoint Presentation: "${file.name}" — ${slidePaths.length} Slides]\n\n` + slideTexts.join("\n\n");
}

export async function processAttachment(file: File): Promise<AttachmentData> {
  if (file.size > MAX_ATTACHMENT_BYTES) {
    throw new Error(`File is too large (${(file.size / (1024 * 1024)).toFixed(1)} MB). eyewee accepts files up to 25 MB.`);
  }

  const name = file.name;
  const lowerName = name.toLowerCase();
  const size = file.size;

  // 1. Image
  if (
    file.type.startsWith("image/") ||
    lowerName.endsWith(".png") ||
    lowerName.endsWith(".jpg") ||
    lowerName.endsWith(".jpeg") ||
    lowerName.endsWith(".webp") ||
    lowerName.endsWith(".gif")
  ) {
    const base64 = await fileToBase64(file);
    const mimeType = file.type || (lowerName.endsWith(".png") ? "image/png" : "image/jpeg");
    const previewUrl = URL.createObjectURL(file);
    return {
      name,
      size,
      type: "image",
      mimeType,
      base64,
      previewUrl,
    };
  }

  // 2. PDF
  if (file.type === "application/pdf" || lowerName.endsWith(".pdf")) {
    const extractedText = await extractPdfText(file);
    return {
      name,
      size,
      type: "pdf",
      mimeType: "application/pdf",
      extractedText: `[PDF Document: "${name}"]\n\n${extractedText}`,
    };
  }

  // 3. PowerPoint (.pptx)
  if (
    lowerName.endsWith(".pptx") ||
    file.type === "application/vnd.openxmlformats-officedocument.presentationml.presentation"
  ) {
    const extractedText = await extractPptxText(file);
    return {
      name,
      size,
      type: "pptx",
      mimeType: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      extractedText,
    };
  }

  // 4. Plain text / Markdown / CSV / JSON
  if (
    file.type.startsWith("text/") ||
    lowerName.endsWith(".txt") ||
    lowerName.endsWith(".md") ||
    lowerName.endsWith(".csv") ||
    lowerName.endsWith(".json")
  ) {
    const extractedText = await file.text();
    return {
      name,
      size,
      type: "text",
      mimeType: file.type || "text/plain",
      extractedText: `[Text Document: "${name}"]\n\n${extractedText}`,
    };
  }

  // Fallback try reading as text
  try {
    const extractedText = await file.text();
    return {
      name,
      size,
      type: "other",
      mimeType: file.type || "application/octet-stream",
      extractedText: `[Document: "${name}"]\n\n${extractedText}`,
    };
  } catch {
    throw new Error(`Unsupported file type: ${name}. Please upload a PDF, Image, PowerPoint (.pptx), or text file.`);
  }
}
