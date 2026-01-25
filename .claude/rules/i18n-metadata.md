---
paths:
  - "**/*.ts"
  - "**/*.tsx"
  - "**/*.js"
  - "**/*.jsx"
  - "**/*.mjs"
  - "**/*.cjs"
universal: false
framework_deps: []
---

# Internationalization & Metadata Governance (Path-Activated)

This rule activates for source files that define metadata or user-visible text.
It ensures multi-language consistency and prevents metadata fragmentation.

> **Framework-agnostic**: Works with any i18n solution (next-intl, i18next, react-intl, vue-i18n, etc.)

---

## Core Principle

All user-visible text MUST flow through the i18n system. Zero hardcoded strings in any language.

```
Single Source of Truth:

  i18n Translation Files (messages/{locale}.json, locales/*.yml, etc.)
                    ↓
         Unified Translation Function (t(), $t(), formatMessage, etc.)
                    ↓
      Page Metadata / Components
```

---

## 0. Scope & SEO Policy (Prevent Fragmentation)

Treat metadata governance differently by SEO intent:

- **Indexable public pages** (intended to rank / bring traffic): MUST follow this rule strictly.
- **Non-indexable pages** (admin/auth/console/payment callbacks/debug/preview): MUST be `noindex` and MAY use minimal constants.

The goal is consistency and safety, not over-optimizing every internal page.

---

## 1. Metadata Data Source Rules

### Allowed Sources

| Priority | Source | Usage |
|----------|--------|-------|
| 1st | `t('namespace.key')` from i18n | Primary source for all text |
| 2nd | Database locale fields (e.g. `name_{locale}`) | For dynamic entities |
| 3rd | i18n fallback key | Only when translation missing, never hardcoded text |

### Forbidden Patterns

```typescript
// ❌ Hardcoded strings
title: 'AI Product - Create Stunning Results'
description: `Create stunning ${category} items with AI.`

// ❌ English fallback text
const title = t('meta.title') || 'Default English Title';

// ❌ Mixed sources
title: `${t('prefix')} | My Site` // Brand suffix should also be i18n

// ✅ Correct: All text from i18n
title: t('meta.title')
title: t('meta.titleWithParam', { style: localizedStyleName })
description: t('meta.description', { category: localizedCategoryName })
```

---

## 2. Brand Suffix Consistency

Define ONE brand suffix format in i18n, use everywhere:

```json
// messages/en.json (or your locale file format)
{
  "brand": {
    "suffix": "| YourBrand",
    "name": "YourBrand"
  }
}
```

```typescript
// Layout template - use i18n brand suffix
title: {
  template: `%s ${t('brand.suffix')}`,
  default: t('metadata.title')
}
```

### Prevent Double-Suffix Bugs (Critical)

Choose ONE of these strategies and enforce it globally:

- **Strategy A (recommended)**: `metadata.title` is the base title (no suffix), layout uses `title.template`.
- **Strategy B**: `metadata.title` already includes suffix, layout MUST NOT append any suffix.

❌ **Forbidden**: suffix appears twice.

---

## 3. i18n Namespace Convention

```
messages/{locale}.json (or locales/{locale}/*.yml)
├── metadata
│   ├── title
│   ├── description
│   └── keywords
├── brand
│   ├── name
│   └── suffix
├── {pageName}
│   └── meta
│       ├── title
│       ├── description
│       └── keywords
└── common
```

---

## 4. New Page Checklist (Metadata)

### Step 1: Define i18n keys first

Add keys to ALL locale files before writing page code:

```
messages/en.json -> {pageName}.meta.title/description/keywords
messages/zh.json -> corresponding translations
(repeat for all supported locales)
```

### Step 2: Use unified pattern

```typescript
// Framework-agnostic example
export async function getPageMetadata({ locale, namespace }): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: `${namespace}.meta` });

  return {
    title: t('title'),
    description: t('description'),
    keywords: t('keywords')
  };
}
```

### Step 3: Verify no hardcoding

```bash
rg "title:" src/ -g "*.{ts,tsx,vue,svelte}" | rg -v "t\(|formatMessage|\$t"
```

---

## 5. Dynamic Entities (DB / CMS / Programmatic SEO)

### 5.1 Database / CMS Multi-language Fields

```typescript
interface Category {
  name: string;
  name_zh?: string;
  name_ja?: string;
  name_es?: string;
}

const localizedName = locale === 'zh'
  ? (category.name_zh || category.name)
  : category.name;

title: t('categoryPage.meta.title', { category: localizedName })
```

❌ **Forbidden**: using default field for all locales without fallback logic.

### 5.2 Programmatic Templates Must Be Per-Locale

```typescript
const supported = ['en', 'zh', 'ja', 'es'] as const;
type Locale = typeof supported[number];

function normalizeLocale(locale: string): Locale {
  if (locale.startsWith('zh')) return 'zh';
  if (locale.startsWith('ja')) return 'ja';
  if (locale.startsWith('es')) return 'es';
  return 'en';
}
```

### 5.3 Fail-Closed for New Locales

If locale content is not ready:
- Set `robots: noindex, follow` for that locale
- Only switch to `index` after content is real and verified

---

## 6. SEO Linkage Rules (hreflang / canonical / sitemap)

- Every indexable URL MUST have a correct `canonical`.
- Every localized URL MUST point to all language versions via `hreflang`, including `x-default`.
- If sitemaps include `hreflang` alternates, they MUST match the `<head>` output.

---

## 7. SSR/SSG Safety Rules

Forbidden in layout and metadata generation for indexable pages:

- Request-bound APIs (`cookies()`, `headers()`, `req.headers`, etc.)
- Auth session checks (`getSession()`, `auth()`)
- Request-bound locale resolvers

Use only:
- Route params (e.g., `params.locale`)
- Translation functions with explicit locale
- Deterministic data sources safe for caching

---

## 8. Migration Priority for Existing Projects

| Priority | Task | Impact |
|----------|------|--------|
| P0 | Unify brand suffix format | Consistency |
| P1 | Resolve naming conflicts (duplicate keys, conflicting namespaces) | Stability |
| P2 | Add missing i18n keys for pages | Completeness |
| P3 | Deprecate hardcoded config objects | Clean architecture |

---

## 9. Verification Commands

```bash
# Find hardcoded strings in metadata (should be empty)
rg "title:" src/ -g "*.{ts,tsx}" | rg -v "t\(|formatMessage" | rg -v "//"

# Find hardcoded English in metadata functions
rg "generateMetadata|getMetadata" src/ -g "*.{ts,tsx}" -C 20 | rg "'[A-Z][a-z]+"

# Check i18n coverage (example: en vs zh)
diff <(rg "\.meta\." messages/en.json | sort) \
     <(rg "\.meta\." messages/zh.json | sort)

# Find inconsistent brand suffixes
rg "\| " src/ -g "*.{ts,tsx}" | rg -v "t\("
```

---

## 10. Common Anti-patterns

### Anti-pattern 1: Config Object as Source

```typescript
// ❌ Hardcoded config as primary source
const SEO_CONFIG = {
  defaultTitle: 'AI Product',
  defaultDescription: '...'
};

title: SEO_CONFIG.defaultTitle

// ✅ Config holds keys, not content
const SEO_KEYS = {
  defaultTitle: 'metadata.title',
  defaultDescription: 'metadata.description'
};

title: t(SEO_KEYS.defaultTitle)
```

### Anti-pattern 2: Fallback Chain with Hardcoded End

```typescript
// ❌ Hardcoded fallback
const title = pageTitle || sectionTitle || 'Default Title';

// ✅ Fallback to i18n key
const title = pageTitle || sectionTitle || t('fallback.title');
```

### Anti-pattern 3: Mixed Sources in Same Page

```typescript
// ❌ Some from i18n, some hardcoded
return {
  title: t('meta.title'),
  description: 'Some description',  // hardcoded!
  keywords: SEO_CONFIG.keywords      // from config object!
};

// ✅ All from i18n
return {
  title: t('meta.title'),
  description: t('meta.description'),
  keywords: t('meta.keywords')
};
```

---

## Checklist (Every Metadata Change)

- [ ] Source: All text comes from `t()` calls, not string concatenation
- [ ] Suffix: Uses unified brand suffix from i18n, no custom format
- [ ] Coverage: Locale files have corresponding keys
- [ ] No Hardcoding: `rg` verification shows no raw strings
- [ ] Locale Fields: Dynamic content uses `*_{locale}` fields
- [ ] Fallback: Any fallback is to i18n key, not hardcoded text
- [ ] Linkage: `canonical` + `hreflang` (+ sitemap if used) are consistent
- [ ] SSR Safe: No request-bound APIs in metadata generation
- [ ] New Locale: If content not ready, `noindex` (fail-closed)

---

## Why This Matters

| Without This Rule | With This Rule |
|-------------------|----------------|
| Pages randomly hardcode English | Must define i18n keys first |
| Each page invents different suffixes | Single brand format enforced |
| Changing one page doesn't update translations | Checklist catches missing keys |
| Nobody knows which "data source" to use | Clear single source of truth |
| Localized pages show default language | Locale-aware content enforced |
| New locales silently fall back to English | Fail-closed until ready |
| Hreflang breaks when adding a language | Linkage rules prevent drift |
| SSR breaks after SEO changes | Request-bound API ban prevents regressions |
