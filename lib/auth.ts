/**
 * Returns the set of admin email addresses from the ADMIN_EMAILS env var.
 * Comma-separated: ADMIN_EMAILS=you@gmail.com,other@gmail.com
 */
export function getAdminEmails(): Set<string> {
  return new Set(
    (process.env.ADMIN_EMAILS ?? '')
      .split(',')
      .map(e => e.trim().toLowerCase())
      .filter(Boolean)
  );
}

/**
 * Server-side Pro check.
 * Returns true when the user has an active Stripe subscription (isPro metadata)
 * OR their email is in the ADMIN_EMAILS env var.
 */
export function isProUser(user: {
  publicMetadata?: Record<string, unknown>;
  emailAddresses?: Array<{ emailAddress: string }>;
} | null): boolean {
  if (!user) return false;
  if (user.publicMetadata?.isPro === true) return true;
  const primaryEmail = user.emailAddresses?.[0]?.emailAddress?.toLowerCase() ?? '';
  return getAdminEmails().has(primaryEmail);
}

/**
 * Same check but also returns whether the user is specifically an admin
 * (so the UI can show an Admin badge instead of a Pro badge).
 */
export function getUserTier(user: {
  publicMetadata?: Record<string, unknown>;
  emailAddresses?: Array<{ emailAddress: string }>;
} | null): { isPro: boolean; isAdmin: boolean } {
  if (!user) return { isPro: false, isAdmin: false };
  const primaryEmail = user.emailAddresses?.[0]?.emailAddress?.toLowerCase() ?? '';
  const isAdmin = getAdminEmails().has(primaryEmail);
  const isPro   = isAdmin || user.publicMetadata?.isPro === true;
  return { isPro, isAdmin };
}
