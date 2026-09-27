import type { MetadataRoute } from "next"

const siteUrl = "https://appoint-nepal.com"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/search", "/business/"],
        disallow: [
          "/api/",
          "/dashboard/",
          "/businesses/",
          "/staff/",
          "/login",
          "/signup",
          "/forgot-password",
          "/reset-password",
          "/account/",
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  }
}
