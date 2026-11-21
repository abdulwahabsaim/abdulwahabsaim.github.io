import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const labs = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/labs' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      name: z.string(),
      category: z.string(),
      categorySlug: z.enum(['campus', 'routing', 'security', 'services', 'firewall']),
      order: z.number(),
      summary: z.string(),
      tags: z.array(z.string()),
      platform: z.string(),
      status: z.enum(['complete', 'in-progress']),
      featured: z.number().optional(),
      repo: z.string(),
      url: z.string(),
      image: image().optional(),
      acknowledgement: z.string().optional(),
      slides: z.array(image()).optional(),
    }),
});

export const collections = { labs };
