import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/api/',
          '/sign-in',
          '/sign-up',
          '/profile',
          '/dashboard',
          '/activity',
          '/workout/',
          '/ninety-day-challenge/posts',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: [
          '/admin/',
          '/api/',
          '/profile',
          '/dashboard',
          '/activity',
          '/workout/',
          '/ninety-day-challenge/posts',
        ],
      },
    ],
    sitemap: 'https://c7personalfitness.com/sitemap.xml',
  }
}