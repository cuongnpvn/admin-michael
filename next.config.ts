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
        source: "/lectures",
        destination: "/courses",
        permanent: true,
      },
      {
        source: "/lectures/:path*",
        destination: "/courses/:path*",
        permanent: true,
      },
      {
        source: "/admin/lectures",
        destination: "/courses",
        permanent: false,
      },
      {
        source: "/admin/lectures/:path*",
        destination: "/courses/:path*",
        permanent: false,
      },
      {
        source: "/admin",
        destination: "/",
        permanent: false,
      },
      {
        source: "/admin/:path*",
        destination: "/:path*",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
