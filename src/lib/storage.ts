export const storageKeys = {
  onboarded: "norma.onboarded",
  notifications: "norma.notifications",
  diet: "norma.diet",
  checkout: "norma.checkout",
} as const;

export type NotificationChoice = "granted" | "denied" | "skipped";

export function readStorage(key: string): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeStorage(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Приватный режим может запретить localStorage. Сценарий продолжается без черновика.
  }
}
