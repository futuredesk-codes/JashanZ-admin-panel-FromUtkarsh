import { Navigate, useLocation } from "react-router-dom";

// Maps each portal's URL prefix to the one production subdomain it's allowed
// to be reached from. Mirrors App.jsx's RootRedirect (which only runs the
// hostname check for the bare "/" route) — this extends the same check to
// every route under these prefixes, so a direct/typed URL like
// finance.jashanz.com/support can't open the wrong portal either.
const PORTAL_HOSTNAMES = {
  admin: "admin.jashanz.com",
  support: "support.jashanz.com",
  finance: "finance.jashanz.com",
  admanager: "admanager.jashanz.com",
};

// Only enforced on the real production subdomains listed above. Any other
// host (localhost in dev, a preview/staging domain, etc.) has no per-portal
// subdomain split in the first place, so every portal must stay reachable
// there — this list is deliberately the allowlist, not a denylist.
const ENFORCED_HOSTNAMES = new Set(Object.values(PORTAL_HOSTNAMES));

/**
 * Wraps a single portal's top-level route (e.g. "/support", "/support/login").
 * On one of the 4 production subdomains, only that subdomain's own portal
 * prefix is allowed through — any other prefix redirects to the portal that
 * actually belongs on this hostname. Off those subdomains (dev/localhost,
 * staging, admin.jashanz.com itself), every portal stays reachable, matching
 * RootRedirect's existing fallback-to-admin behavior.
 */
export default function SubdomainGuard({ portal, children }) {
  const { hostname } = window.location;
  const { pathname } = useLocation();

  if (!ENFORCED_HOSTNAMES.has(hostname)) return children;

  const expectedHostname = PORTAL_HOSTNAMES[portal];
  if (hostname === expectedHostname) return children;

  const correctEntry = Object.entries(PORTAL_HOSTNAMES).find(
    ([, host]) => host === hostname,
  );
  const correctPortal = correctEntry ? correctEntry[0] : "admin";

  // Avoid redirect loops if this ever ends up guarding the correct portal's
  // own route by mistake.
  if (pathname.startsWith(`/${correctPortal}`)) return children;

  return <Navigate to={`/${correctPortal}/login`} replace />;
}
