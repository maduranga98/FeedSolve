/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove "output: export" so `next dev` works normally.
  // Add it back only when building a fully static bundle: output: "export"
  images: {
    unoptimized: true, // required when output: "export" is active
  },
};

export default nextConfig;
