import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Fotos de hasta 8 MB más el overhead de multipart/form-data.
      bodySizeLimit: "9mb",
    },
  },
};

export default nextConfig;
