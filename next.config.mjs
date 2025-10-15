// @ts-check

/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  reactStrictMode: false,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'shu7sxuwbwejohey.public.blob.vercel-storage.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  webpack: (config, { isServer }) => {
    // Suppress warnings for HEIC/libheif dynamic require statements
    config.module.rules.push({
      test: /libheif/,
      resolve: {
        fallback: {
          fs: false,
          path: false,
        },
      },
    });

    // Ignore critical dependency warnings for libheif-wasm
    config.ignoreWarnings = [
      ...(config.ignoreWarnings || []),
      {
        module: /libheif-js\/libheif-wasm\/libheif-bundle\.js/,
        message: /Critical dependency: require function is used in a way in which dependencies cannot be statically extracted/,
      },
      {
        module: /heic-convert/,
        message: /Critical dependency/,
      },
      {
        module: /heic-decode/,
        message: /Critical dependency/,
      },
    ];

    return config;
  },
};

export default nextConfig;
