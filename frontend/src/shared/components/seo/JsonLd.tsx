/**
 * @fileoverview JSON-LD structured data component for SEO
 * @input Schema data object
 * @output Renders script tag with structured data
 * @pos Used in page layouts to add Schema.org structured data
 */

export interface JsonLdProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: Record<string, any>;
}

/**
 * Renders JSON-LD structured data as a script tag
 * Use this component to add Schema.org structured data to pages
 *
 * Note: dangerouslySetInnerHTML is safe here because:
 * - Data comes from application code, not user input
 * - JSON.stringify properly escapes special characters
 * - This is the standard Next.js pattern for JSON-LD
 */
export function JsonLd({ data }: JsonLdProps) {
  const jsonString = JSON.stringify(data);

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: jsonString }}
    />
  );
}

// Schema type helpers for common use cases

export interface WebSiteSchema {
  '@context': 'https://schema.org';
  '@type': 'WebSite';
  name: string;
  url: string;
  description?: string;
  potentialAction?: {
    '@type': 'SearchAction';
    target: string;
    'query-input': string;
  };
}

export interface OrganizationSchema {
  '@context': 'https://schema.org';
  '@type': 'Organization';
  name: string;
  url: string;
  logo?: string;
  description?: string;
  sameAs?: string[];
}

export interface BreadcrumbItem {
  '@type': 'ListItem';
  position: number;
  name: string;
  item?: string;
}

export interface BreadcrumbListSchema {
  '@context': 'https://schema.org';
  '@type': 'BreadcrumbList';
  itemListElement: BreadcrumbItem[];
}

/**
 * Creates a WebSite schema object
 */
export function createWebSiteSchema(
  name: string,
  url: string,
  options?: {
    description?: string;
    searchUrl?: string;
  }
): WebSiteSchema {
  const schema: WebSiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name,
    url,
  };

  if (options?.description) {
    schema.description = options.description;
  }

  if (options?.searchUrl) {
    schema.potentialAction = {
      '@type': 'SearchAction',
      target: `${options.searchUrl}?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    };
  }

  return schema;
}

/**
 * Creates an Organization schema object
 */
export function createOrganizationSchema(
  name: string,
  url: string,
  options?: {
    logo?: string;
    description?: string;
    sameAs?: string[];
  }
): OrganizationSchema {
  const schema: OrganizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name,
    url,
  };

  if (options?.logo) {
    schema.logo = options.logo;
  }

  if (options?.description) {
    schema.description = options.description;
  }

  if (options?.sameAs && options.sameAs.length > 0) {
    schema.sameAs = options.sameAs;
  }

  return schema;
}

/**
 * Creates a BreadcrumbList schema object
 */
export function createBreadcrumbSchema(
  items: Array<{ name: string; url?: string }>
): BreadcrumbListSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      ...(item.url ? { item: item.url } : {}),
    })),
  };
}
