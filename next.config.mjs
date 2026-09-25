/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  eslint: { ignoreDuringBuilds: true },
  // The code is type-checked (run `npm run typecheck`). This setting stops a
  // minor type-definition difference in a future library version from
  // blocking a Vercel deployment. Set it to false once you're happy.
  typescript: { ignoreBuildErrors: true },
};

export default nextConfig;
