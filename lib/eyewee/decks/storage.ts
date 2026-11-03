import "server-only";

import { createEyeweeServiceClient } from "@/lib/eyewee/supabaseAdmin";

// Private Supabase Storage bucket for generated decks (brief, Step 6). Vercel can't keep files, so
// each .pptx is uploaded here, handed out via a ~1 hour signed link, and deleted after 24 hours.
// Folder names start with the creation time in epoch ms, so the cleanup job can age files without
// any database row -- we keep no slide content or deck metadata in the DB.
export const DECK_BUCKET = "eyewee-decks";
export const SIGNED_URL_SECONDS = 60 * 60;
export const RETENTION_MS = 24 * 60 * 60 * 1000;

const PPTX_MIME = "application/vnd.openxmlformats-officedocument.presentationml.presentation";

let bucketReady = false;

async function ensureBucket() {
  if (bucketReady) return;
  const supabase = createEyeweeServiceClient();
  const { error } = await supabase.storage.createBucket(DECK_BUCKET, { public: false });
  if (error && !/already exists|duplicate/i.test(error.message)) throw new Error(`Storage bucket unavailable: ${error.message}`);
  bucketReady = true;
}

export async function storeDeck(filename: string, data: Buffer, createdAt: Date): Promise<string> {
  await ensureBucket();
  const supabase = createEyeweeServiceClient();
  const path = `${createdAt.getTime()}-${crypto.randomUUID()}/${filename}`;

  const { error: uploadError } = await supabase.storage.from(DECK_BUCKET).upload(path, data, { contentType: PPTX_MIME, upsert: false });
  if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

  const { data: signed, error: signError } = await supabase.storage.from(DECK_BUCKET).createSignedUrl(path, SIGNED_URL_SECONDS, { download: filename });
  if (signError || !signed?.signedUrl) {
    await supabase.storage.from(DECK_BUCKET).remove([path]).catch(() => undefined);
    throw new Error(`Could not create a download link: ${signError?.message ?? "unknown error"}`);
  }

  // "Never show a link that does not work": fetch the first byte through the signed URL before
  // handing it out. If it can't be read, delete the file and fail.
  const probe = await fetch(signed.signedUrl, { headers: { Range: "bytes=0-0" } }).catch(() => null);
  if (!probe || !(probe.status === 200 || probe.status === 206)) {
    await supabase.storage.from(DECK_BUCKET).remove([path]).catch(() => undefined);
    throw new Error("The download link could not be verified.");
  }
  await probe.body?.cancel().catch(() => undefined);
  return signed.signedUrl;
}

// Deletes every deck older than 24 hours. Called by the scheduled job (/api/decks/cleanup).
export async function deleteExpiredDecks(now = Date.now()): Promise<number> {
  const supabase = createEyeweeServiceClient();
  const bucket = supabase.storage.from(DECK_BUCKET);
  const { data: folders, error } = await bucket.list("", { limit: 1000 });
  if (error) throw new Error(`Cleanup list failed: ${error.message}`);

  const toRemove: string[] = [];
  for (const folder of folders ?? []) {
    const createdMs = Number(folder.name.split("-")[0]);
    if (!Number.isFinite(createdMs) || now - createdMs < RETENTION_MS) continue;
    const { data: files } = await bucket.list(folder.name, { limit: 100 });
    for (const file of files ?? []) toRemove.push(`${folder.name}/${file.name}`);
  }
  if (toRemove.length === 0) return 0;

  const { error: removeError } = await bucket.remove(toRemove);
  if (removeError) throw new Error(`Cleanup delete failed: ${removeError.message}`);
  return toRemove.length;
}
