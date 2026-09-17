import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DOMAIN = "https://sms.mifumolabs.com";

// Primary marketing/SEO pages we want Google to see clearly
const PAGE_ROUTES = [
	{ path: "/", priority: "1.0", changefreq: "daily" }, // Home
	{ path: "/pricing", priority: "0.9", changefreq: "weekly" }, // Pricing
	{ path: "/features", priority: "0.9", changefreq: "weekly" }, // Features
	{ path: "/developer", priority: "0.8", changefreq: "monthly" }, // Developer docs / info
];

function buildUrlSet(routes, lastmod) {
	return routes
		.map(
			(route) => `
  <url>
    <loc>${DOMAIN}${route.path}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`
		)
		.join("");
}

function generateSitemaps() {
	const lastmod = new Date().toISOString();
	const distPath = path.join(__dirname, "dist");

	if (!fs.existsSync(distPath)) {
		fs.mkdirSync(distPath, { recursive: true });
	}

	// 1) Pages sitemap (core marketing pages)
	const pagesUrlset = buildUrlSet(PAGE_ROUTES, lastmod);
	const pagesSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pagesUrlset}
</urlset>`;
	fs.writeFileSync(path.join(distPath, "sitemap-pages.xml"), pagesSitemap);

	// 2) Blog sitemap placeholder (kept minimal for now)
	const blogSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
</urlset>`;
	fs.writeFileSync(path.join(distPath, "sitemap-blog.xml"), blogSitemap);

	// 3) Products sitemap placeholder (for future SMS packages / products)
	const productsSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
</urlset>`;
	fs.writeFileSync(path.join(distPath, "sitemap-products.xml"), productsSitemap);

	// 4) Master sitemap index, referencing all the above
	const sitemapIndex = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${DOMAIN}/sitemap-pages.xml</loc>
    <lastmod>${lastmod}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${DOMAIN}/sitemap-blog.xml</loc>
    <lastmod>${lastmod}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${DOMAIN}/sitemap-products.xml</loc>
    <lastmod>${lastmod}</lastmod>
  </sitemap>
</sitemapindex>`;

	fs.writeFileSync(path.join(distPath, "sitemap.xml"), sitemapIndex);
	console.log(`✅ Sitemaps generated at: ${distPath}/sitemap*.xml`);
}

generateSitemaps();
