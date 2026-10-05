import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() { return [{ source: '/admin/sw.js', headers: [{ key: 'Cache-Control', value: 'no-store, max-age=0' }, { key: 'Content-Type', value: 'application/javascript; charset=utf-8' }, { key: 'X-Content-Type-Options', value: 'nosniff' }] }]; },
  images: { remotePatterns: [{ protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/website-media/**", search: "" }] },
  experimental: { serverActions: { bodySizeLimit: "9mb" } },
};

export default nextConfig;
