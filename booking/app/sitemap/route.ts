import { NextResponse } from "next/server"

const siteUrl = "https://appoint-nepal.com"

export function GET() {
  const urls = ["/", "/search", "/register-business", "/help", "/terms", "/privacy"]
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((path) => `  <url><loc>${siteUrl}${path}</loc></url>`).join("\n")}
</urlset>`

  return new NextResponse(body, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  })
}
