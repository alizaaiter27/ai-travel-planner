import type { NextConfig } from "next";

// Security headers sent with every response. Each closes off a common attack
// at no cost to the app.
const securityHeaders = [
  // Don't let browsers guess file types (stops some script-injection tricks).
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Don't allow other sites to show our pages in a frame (clickjacking).
  { key: "X-Frame-Options", value: "DENY" },
  // When following a link to another site, send only our domain, never the
  // full URL — saved-trip links are private and must not leak.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // We don't use these browser features, so turn them off entirely.
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
];

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // Don't advertise "X-Powered-By: Next.js" to visitors.
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
