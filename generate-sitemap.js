import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DOMAIN = "https://sms.mifumolabs.com";

const routes = [
	{ path: "/", priority: "1.0", changefreq: "daily" },
	{ path: "/dashboard", priority: "0.9", changefreq: "daily" },
	{ path: "/contacts", priority: "0.9", changefreq: "weekly" },
	{ path: "/campaigns", priority: "0.9", changefreq: "weekly" },
	{ path: "/templates", priority: "0.8", changefreq: "weekly" },
	{ path: "/analytics", priority: "0.8", changefreq: "daily" },
	{ path: "/notifications", priority: "0.7", changefreq: "weekly" },
	{ path: "/settings", priority: "0.7", changefreq: "monthly" },
	{ path: "/developer", priority: "0.8", changefreq: "monthly" },
	{ path: "/sms-packages", priority: "0.9", changefreq: "weekly" },
	{ path: "/conversations", priority: "0.8", changefreq: "daily" },
	{ path: "/login", priority: "0.5", changefreq: "monthly" },
	{ path: "/signup", priority: "0.5", changefreq: "monthly" },
	{ path: "/forgot-password", priority: "0.5", changefreq: "monthly" },
	{ path: "/reset-password", priority: "0.5", changefreq: "monthly" },
	{ path: "/integration-guide", priority: "0.8", changefreq: "monthly" },
	{ path: "/terms", priority: "0.5", changefreq: "monthly" },
	{ path: "/privacy", priority: "0.5", changefreq: "monthly" },
];

function generateSitemap() {
	const lastmod = new Date().toISOString();

	const urlset = routes
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

	const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlset}
</urlset>`;

	const distPath = path.join(__dirname, "dist");
	if (!fs.existsSync(distPath)) {
		fs.mkdirSync(distPath, { recursive: true });
	}

	fs.writeFileSync(path.join(distPath, "sitemap.xml"), sitemap);
	console.log(`✅ Sitemap generated at: ${distPath}/sitemap.xml`);
}

generateSitemap();
