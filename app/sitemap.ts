import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://hoodoption.com';
  const now = new Date();

  return [
    {
      url: base,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${base}/dashboard`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${base}/learn`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${base}/blog`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${base}/blog/0dte-options-trading-guide`,
      lastModified: new Date('2025-05-15'),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${base}/blog/how-to-read-vwap`,
      lastModified: new Date('2025-05-22'),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${base}/blog/macd-bollinger-bands-options`,
      lastModified: new Date('2025-05-28'),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${base}/blog/risk-management-0dte`,
      lastModified: new Date('2025-06-03'),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${base}/blog/spy-qqq-options-strategy`,
      lastModified: new Date('2025-06-10'),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${base}/blog/understanding-options-greeks`,
      lastModified: new Date('2025-06-17'),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${base}/pricing`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${base}/about`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${base}/privacy`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${base}/terms`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ];
}
