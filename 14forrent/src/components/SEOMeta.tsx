import { Helmet } from 'react-helmet-async';

interface SEOMetaProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'product' | 'place';
  structuredData?: object | object[];
  canonical?: string;
  noindex?: boolean;
  breadcrumbs?: Array<{ name: string; url: string }>;
}

const SEOMeta = ({
  title = "14ForRent - Reinventing Renting | AI-Powered Property Search & Rental Platform",
  description = "Find your perfect rental property with 14ForRent's AI-powered platform. Search apartments, houses, and condos in Los Angeles. Modern property management and tenant services.",
  keywords = "property rental, apartment search, house rental, Los Angeles rentals, rental properties, property management, tenant services, real estate listings",
  image = "https://14forrent.com/lovable-uploads/8ea6f0a3-c771-40fc-8eef-653ab9af47a2.png",
  url = "https://14forrent.com/",
  type = "website",
  structuredData,
  canonical,
  noindex = false,
  breadcrumbs
}: SEOMetaProps) => {
  // Generate breadcrumb structured data if provided
  const breadcrumbStructuredData = breadcrumbs ? {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": breadcrumbs.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": item.url
    }))
  } : null;

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="robots" content={noindex ? "noindex, nofollow" : "index, follow"} />
      
      {/* Canonical URL */}
      {canonical && <link rel="canonical" href={canonical} />}
      
      {/* Open Graph Meta Tags */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={image} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={title} />
      <meta property="og:site_name" content="14ForRent" />
      <meta property="og:locale" content="en_US" />

      {/* Twitter Card Meta Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@14ForRent" />
      <meta name="twitter:creator" content="@14ForRent" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      <meta name="twitter:image:alt" content={title} />
      
      {/* Apple/iMessage Specific Meta Tags */}
      <meta name="apple-mobile-web-app-title" content="14ForRent" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="format-detection" content="telephone=no" />

      {/* Structured Data */}
      {structuredData && (
        Array.isArray(structuredData) ? (
          structuredData.map((data, index) => (
            <script key={index} type="application/ld+json">
              {JSON.stringify(data)}
            </script>
          ))
        ) : (
          <script type="application/ld+json">
            {JSON.stringify(structuredData)}
          </script>
        )
      )}
      
      {/* Breadcrumb Structured Data */}
      {breadcrumbStructuredData && (
        <script type="application/ld+json">
          {JSON.stringify(breadcrumbStructuredData)}
        </script>
      )}
    </Helmet>
  );
};

export default SEOMeta;