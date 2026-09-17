// Placeholder responder -- explicitly not a live model call. The endpoint that sends a message to
// a real model stays behind the crisis-response hold (docs/SPEC.md Section 2.1) until legal +
// mental-health-professional clearance. This keeps the real request/response round trip (and the
// eye's thinking <-> spark transition tied to it) working end to end while that gate is closed --
// it says plainly that it's still being built rather than pretending to be a finished model.
const STILL_BUILDING_REPLIES = [
  "I heard every word of that -- I just don't have my real brain wired in yet. The team's still building me. Ask me again soon; I promise I'll be worth the wait.",
  "Honestly? I'm still in the workshop. The clever, all-knowing version of me is being built right now -- check back soon and I'll actually crack this one with you.",
  "You caught me before I was ready -- I'm still being built behind the scenes. For now, consider this me practicing my listening face.",
  "That's a great question, and I'd love to actually answer it. Truth is, I'm still under construction -- give it a little longer and I'll have something real to say back.",
];

export function craftReply(message: string) {
  if (!message.trim()) return STILL_BUILDING_REPLIES[0];
  const index = Math.floor(Math.random() * STILL_BUILDING_REPLIES.length);
  return STILL_BUILDING_REPLIES[index];
}
