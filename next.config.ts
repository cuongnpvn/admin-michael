import type { NextConfig } from "next";

/** Dev proxy default is 30s; exam import and upload steps can run several minutes. */
const PROXY_TIMEOUT_MS = 5 * 60 * 1000;

const UPLOAD_BODY_LIMIT = "100mb";

const nextConfig: NextConfig = {
  // jsdom must stay a native Node require. Bundling it into RSC/SSR breaks
  // isomorphic-dompurify and can crash the Next.js instant-validation worker.
  serverExternalPackages: ["isomorphic-dompurify", "jsdom"],
  experimental: {
    agentFeedback: true,
    proxyTimeout: PROXY_TIMEOUT_MS,
    proxyClientMaxBodySize: UPLOAD_BODY_LIMIT,
    serverActions: {
      bodySizeLimit: UPLOAD_BODY_LIMIT,
    },
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async redirects() {
    return [
      {
        source: "/admin/lectures",
        destination: "/admin/courses",
        permanent: true,
      },
      {
        source: "/admin/lectures/:path*",
        destination: "/admin/courses/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
