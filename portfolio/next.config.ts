import type { NextConfig } from "next";

// Static export: `npm run build` produces a fully static site in /out
// that can be hosted anywhere (Vercel, Netlify, GitHub Pages, any CDN).
const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
