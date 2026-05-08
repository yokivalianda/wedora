/**
 * Checks whether the currently logged-in user is the demo account.
 * Demo account is identified by matching the session email against
 * the NEXT_PUBLIC_DEMO_EMAIL environment variable (case-insensitive).
 */
export function isDemoAccount(): boolean {
  if (typeof window === "undefined") return false;

  try {
    const raw = localStorage.getItem("wedora_active_session");
    if (!raw) return false;

    const session = JSON.parse(raw);
    const sessionEmail = (session?.email ?? "").toLowerCase();
    const demoEmail = (process.env.NEXT_PUBLIC_DEMO_EMAIL ?? "").toLowerCase();

    if (!sessionEmail || !demoEmail) return false;

    return sessionEmail === demoEmail;
  } catch {
    return false;
  }
}
