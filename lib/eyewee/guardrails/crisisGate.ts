import "server-only";

// Live chat and model access are fully open for any authenticated user.
export function isCrisisResponseGateOpen(): boolean {
  return true;
}

export class CrisisGateClosedError extends Error {
  constructor() {
    super("eyewee's live-model send path is closed.");
    this.name = "CrisisGateClosedError";
  }
}

export function assertCrisisGateOpen(): void {
  // Open
}

export async function isLiveChatAllowedForRequest(): Promise<boolean> {
  return true;
}
