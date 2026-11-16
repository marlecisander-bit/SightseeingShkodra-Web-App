import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async redirects() {
    // Exact retired public entry points only; never match customer/token routes.
    return [
      // Public marketing only. Transactional/customer/auth/API routes retain their origin.
      ...["sightseeingshkodra.app", "www.sightseeingshkodra.app"].flatMap(host => [
        ...["/", "/book", "/route", "/explore", "/explore/:slug", "/faq", "/privacy-policy", "/terms-and-conditions", "/live", "/credits"].map(source => ({
          source, destination: `https://www.sightseeingshkodra.com${source}`, permanent: true,
          has: [{type: "host" as const, value: host.replaceAll(".", "\\.")}],
        })),
        ...[{source:"/tickets",path:"/book"},{source:"/tour",path:"/book"},{source:"/mes-bridge-shkodra",path:"/explore/bridge"}].map(({source,path}) => ({
          source, destination: `https://www.sightseeingshkodra.com${path}`, permanent: true,
          has: [{type:"host" as const,value:host.replaceAll(".","\\.")}],
        })),
      ]),
      { source: "/tickets", destination: "/book", permanent: true },
      { source: "/mes-bridge-shkodra", destination: "/explore/bridge", permanent: true },
    ];
  },
  async headers() { return [...['/admin/:path*', '/auth/:path*', '/api/:path*', '/booking/:path*', '/dev/:path*', '/your-day', '/credits'].map(source => ({source, headers: [{key: 'X-Robots-Tag', value: 'noindex, nofollow'}]})), {source:'/admin/:operatorId/website-preview',headers:[{key:'Content-Security-Policy',value:"connect-src 'none'; frame-src 'none'; form-action 'none'; object-src 'none'; base-uri 'self'"}]},{ source: '/admin/sw.js', headers: [{ key: 'Cache-Control', value: 'no-store, max-age=0' }, { key: 'Content-Type', value: 'application/javascript; charset=utf-8' }, { key: 'X-Content-Type-Options', value: 'nosniff' }] }]; },
  images: { formats: ["image/avif", "image/webp"], remotePatterns: [{ protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/website-media/**", search: "" }] },
  experimental: { serverActions: { bodySizeLimit: "9mb" } },
};

export default nextConfig;
