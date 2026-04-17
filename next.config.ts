import type { NextConfig } from "next";

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/$/, '') || 'http://localhost:8000';
const backendHost = new URL(backendUrl).hostname;
const backendProtocol = new URL(backendUrl).protocol.replace(':', '') as 'http' | 'https';
const backendPort = new URL(backendUrl).port || (backendProtocol === 'https' ? '443' : '80');
const wsProtocol = backendProtocol === 'https' ? 'wss' : 'ws';

// @ts-ignore
const nextConfig = {
  output: 'standalone',
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'http',

        hostname: 'localhost',
        port: '8000',
        pathname: '/static/**',
      },
      {
        protocol: backendProtocol,
        hostname: backendHost,
        pathname: '/static/**',
      },
      {
        protocol: 'https',
        hostname: '*.fal.media',
      },
      {
        protocol: 'https',
        hostname: 'fal.media',
      },
      {
        protocol: 'https',
        hostname: 'pbxt.replicate.delivery',
      },
      {
        protocol: 'https',
        hostname: 'replicate.delivery',
      }
    ],
    unoptimized: false,
  },
  async redirects() {
    return [
      {
        source: '/admin',
        destination: 'https://admin.lumoraboutique.com/',
        permanent: false,
      },
      {
        source: '/admin/:path*',
        destination: 'https://admin.lumoraboutique.com/:path*',
        permanent: false,
      }
    ];
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Content-Security-Policy',
            value: `default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://static.cloudflareinsights.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: ${backendUrl}; connect-src 'self' https://cloudflareinsights.com ${backendUrl} ${wsProtocol}://${backendHost}${backendPort !== '443' && backendPort !== '80' ? ':' + backendPort : ''}; font-src 'self' data:; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none';`
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()'
          }
        ]
      }
    ];
  }
};

export default nextConfig;
