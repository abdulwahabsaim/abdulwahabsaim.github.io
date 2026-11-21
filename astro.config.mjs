// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import icon from 'astro-icon';
import { unified } from '@astrojs/markdown-remark';
import rehypeCli from './src/lib/rehype-cli.mjs';

export default defineConfig({
  site: 'https://abdulwahabsaim.github.io',
  trailingSlash: 'ignore',
  integrations: [icon(), sitemap()],
  markdown: {
    // Cisco IOS has no Shiki grammar; rehype-cli styles prompts, commands and comments instead.
    syntaxHighlight: false,
    processor: unified({ rehypePlugins: [rehypeCli] }),
  },
  prefetch: { prefetchAll: false, defaultStrategy: 'hover' },
  devToolbar: { enabled: false },
});
