import { copyFileSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Serve the RTL text plugin from public/ instead of an external CDN
try {
  mkdirSync(resolve(__dirname, "public"), { recursive: true });
  copyFileSync(
    resolve(__dirname, "node_modules/@mapbox/mapbox-gl-rtl-text/dist/mapbox-gl-rtl-text.js"),
    resolve(__dirname, "public/mapbox-gl-rtl-text.js")
  );
} catch (e) {
  console.warn("Could not copy RTL text plugin:", e.message);
}

const basePath = process.env.BASEURL ? `/${process.env.BASEURL}` : "";

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  basePath,
  assetPrefix: basePath,
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
  images: {
    unoptimized: true,
  },
  webpack(config) {
    // Enable WebAssembly for @geoarrow/geoarrow-wasm
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
    };

    // Handle SVG imports as React components (replaces vite-plugin-svgr)
    const fileLoaderRule = config.module.rules.find((rule) =>
      rule.test?.test?.(".svg")
    );

    config.module.rules.push(
      // Reapply the existing rule, but only for svg imports not ending with ?react
      {
        ...fileLoaderRule,
        test: /\.svg$/i,
        resourceQuery: { not: [/react/] },
      },
      // Convert *.svg?react imports to React components
      {
        test: /\.svg$/i,
        resourceQuery: /react/,
        use: ["@svgr/webpack"],
      }
    );

    // Modify the file loader rule to ignore *.svg
    fileLoaderRule.exclude = /\.svg$/i;

    // Handle .wasm?url imports
    config.module.rules.push({
      test: /\.wasm$/,
      type: "asset/resource",
    });

    return config;
  },
};

export default nextConfig;
