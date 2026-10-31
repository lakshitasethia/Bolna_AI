import type { NextConfig } from "next";

// Loads live in one process's memory, but Vercel runs several instances at once,
// so a load saved on one was a 404 on the next. On Vercel, every API call goes to
// the single Render process that the Bolna agents also call.
const apiOrigin = process.env.BHAADA_API_ORIGIN ?? (process.env.VERCEL ? "https://bolna-ai.onrender.com" : undefined);

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  async rewrites() {
    return {
      // beforeFiles, because the API routes also exist in this build and would win otherwise.
      beforeFiles: apiOrigin ? [{ source: "/api/:path*", destination: `${apiOrigin}/api/:path*` }] : [],
      afterFiles: [],
      fallback: [],
    };
  },
};

export default nextConfig;
