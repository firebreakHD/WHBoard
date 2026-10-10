import type { NextConfig } from "next";
const nextConfig: NextConfig = { output: "standalone", serverExternalPackages: ["pdfjs-dist"], outputFileTracingIncludes: {"/api/kostenrechnung/import": ["./node_modules/pdfjs-dist/legacy/build/**", "./node_modules/@napi-rs/canvas*/**"]} };
export default nextConfig;
