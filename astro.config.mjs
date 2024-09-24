// @ts-check
import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import tailwind from "@astrojs/tailwind";

import netlify from "@astrojs/netlify";

// https://astro.build/config
export default defineConfig({
    site: "https://s33h0w.github.io",
    integrations: [
        mdx(),
        sitemap({
            changefreq: "daily",
            priority: 1,
            lastmod: new Date(),
        }),
        tailwind(),
    ],
    output: "server",
    adapter: netlify(),
});
