---
paths:
  - "**/seo/**"
  - "**/seo.ts"
  - "**/sitemap*"
  - "**/robots*"
  - "**/generateMetadata*"
  - "**/metadata*"
  - "**/head.tsx"
universal: false
framework_deps: []
---

# SEO Development Rules (Path-Activated)

Automatically activated when working with SEO-related files.
This rule is **framework-agnostic** and applies to any web project with SEO requirements.

---

## 1. URL Policy + Canonical (Single Source of Truth)

- Canonical URLs must be derived from config (e.g., `APP_URL`, `SITE_URL`), not hardcoded.
- Define a single allowed-slug source (DB/config) and expose a validator.
- Do not construct public URLs from keywords without validation.

### Locale Rules (if i18n enabled)

- Default locale: no prefix (if using `localePrefix="as-needed"` pattern).
- Non-default locales: add `/{locale}` prefix.
- Canonical and hreflang MUST follow the same rule.

```typescript
// Example canonical with locale
const baseUrl = process.env.APP_URL || 'https://example.com';
const canonical = locale !== defaultLocale
  ? `${baseUrl}/${locale}/${path}`
  : `${baseUrl}/${path}`;
```

---

## 2. Index / Noindex Rules

- Mark user-specific or param-heavy pages as `noindex`.
- Only index stable, content-rich pages.
- Avoid indexing pages with infinite parameter combinations.
- For dynamic combinations, use a whitelist + content threshold.

| Page Type | Recommendation |
|-----------|----------------|
| Public content pages | `index, follow` |
| User dashboard/profile | `noindex, nofollow` |
| Search results with params | `noindex, follow` |
| Auth pages (login/signup) | `noindex, nofollow` |
| Admin/internal pages | `noindex, nofollow` |

---

## 3. Internal Link Generation Rules

All internal links must be reachable and valid.

```typescript
const candidateSlug = slugify(keyword);

if (isAllowedSlug(candidateSlug)) {
  return `/${candidateSlug}`;
}

// Fallback to a safe hub page
return '/browse';
```

### Forbidden Patterns
- ❌ Constructing URLs without validation
- ❌ Emitting links that 404
- ❌ Each component maintaining its own slug list

---

## 4. Metadata Requirements

- Title/description/keywords should come from i18n or config.
- Avoid hardcoded brand strings inside components; use config/i18n brand suffix.
- OpenGraph/Twitter data must match page content.

```typescript
// Framework-agnostic metadata structure
export function getPageMetadata({ locale, page }): Metadata {
  const t = getTranslations(locale);
  const baseUrl = process.env.APP_URL;

  return {
    title: t(`${page}.meta.title`),
    description: t(`${page}.meta.description`),
    alternates: {
      canonical: buildCanonicalUrl(baseUrl, locale, page)
    },
    robots: {
      index: shouldIndex(page),
      follow: true
    },
    openGraph: {
      title: t(`${page}.meta.title`),
      description: t(`${page}.meta.description`),
      url: buildCanonicalUrl(baseUrl, locale, page),
      images: [{ url: `${baseUrl}/og/${page}.png` }]
    },
    twitter: {
      card: 'summary_large_image'
    }
  };
}
```

---

## 5. Structured Data (JSON-LD)

- Only include schema that is truthful and matches visible content.
- Never include fake ratings/reviews or placeholder values.
- Include required types when relevant:

| Schema Type | When to Use |
|-------------|-------------|
| `BreadcrumbList` | Navigational pages with hierarchy |
| `Organization` | Site-wide (usually in layout) |
| `WebSite` | Homepage |
| `Article` | Blog posts, news |
| `Product` | E-commerce product pages |
| `FAQPage` | FAQ sections |
| `CollectionPage` | Category/listing pages |

---

## 6. GEO Optimization (AI-Friendly Content)

- Clear heading hierarchy (H1/H2/H3).
- Use bullet lists or tables for scanability.
- First 50 words should answer the core query.
- Prefer Q&A formatting for long content.

---

## 7. Site-Level Rules

- HTTPS everywhere; http → https 301.
- `robots.txt` must be accessible and reference sitemap.
- Sitemaps must only include indexable URLs (no 404/redirect/noindex).

---

## Checklist

- [ ] Canonical uses config-derived base URL (not hardcoded)
- [ ] Locale prefix rules applied (if i18n enabled)
- [ ] Allowed-slug validator used for dynamic routes
- [ ] noindex applied to param-heavy/user-specific pages
- [ ] Metadata comes from config or translations
- [ ] Structured data is truthful and complete
- [ ] Sitemap/robots are consistent

## Verification Commands

```bash
# Check canonical output (replace with your domain)
curl -s https://${APP_URL}/page | rg -i "canonical"

# Check robots meta
curl -s https://${APP_URL}/page | rg -i "robots"

# Check hreflang
curl -s https://${APP_URL}/page | rg -i "hreflang"

# Check sitemap
curl -s https://${APP_URL}/sitemap.xml | head -50

# Find hardcoded URLs in codebase
rg "https?://[a-z]+\.(com|org|io|net)" src/ -g "*.{ts,tsx}" --ignore-case

# Find metadata without i18n
rg "title:|description:" src/ -g "*.{ts,tsx}" | rg -v "t\(|translate|i18n"
```

> **Note**: Replace `${APP_URL}` with your actual domain or environment variable.
