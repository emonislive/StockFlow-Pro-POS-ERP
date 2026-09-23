import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://stockflow.example.com';

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/auth/login', '/auth/register'],
        disallow: ['/api/', '/audit-logs', '/reports'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
