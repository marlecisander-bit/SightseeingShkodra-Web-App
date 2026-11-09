import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() { return [...['/admin/:path*', '/auth/:path*', '/api/:path*', '/booking/:path*', '/dev/:path*', '/your-day', '/credits'].map(source => ({source, headers: [{key: 'X-Robots-Tag', value: 'noindex, nofollow'}]})), {source:'/admin/:operatorId/website-preview',headers:[{key:'Content-Security-Policy',value:"connect-src 'none'; frame-src 'none'; form-action 'none'; object-src 'none'; base-uri 'self'"}]},{ source: '/admin/sw.js', headers: [{ key: 'Cache-Control', value: 'no-store, max-age=0' }, { key: 'Content-Type', value: 'application/javascript; charset=utf-8' }, { key: 'X-Content-Type-Options', value: 'nosniff' }] }]; },
  images: { remotePatterns: [{ protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/website-media/**", search: "" }] },
  experimental: { serverActions: { bodySizeLimit: "9mb" } },
};

export default nextConfig;
