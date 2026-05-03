import { BUSINESS } from "./business";

/**
 * JSON-LD builders. Each returns a plain object suitable for `<JsonLd>`.
 * Keep these pure (no I/O) so they can run at build time.
 */

const ORG_ID = `${BUSINESS.url}#business`;

function postalAddress() {
  return {
    "@type": "PostalAddress",
    streetAddress: BUSINESS.address.street,
    addressLocality: BUSINESS.address.city,
    addressRegion: BUSINESS.address.region,
    postalCode: BUSINESS.address.postalCode,
    addressCountry: BUSINESS.address.country,
  };
}

function geoCoordinates() {
  return {
    "@type": "GeoCoordinates",
    latitude: BUSINESS.geo.latitude,
    longitude: BUSINESS.geo.longitude,
  };
}

function openingHoursSpecification() {
  return BUSINESS.hours.map((h) => ({
    "@type": "OpeningHoursSpecification",
    dayOfWeek: `https://schema.org/${h.day}`,
    opens: h.opens,
    closes: h.closes,
  }));
}

function areaServedCities() {
  return BUSINESS.serviceAreaCities.map((name) => ({
    "@type": "City",
    name,
    containedInPlace: { "@type": "State", name: "California" },
  }));
}

function offerCatalog() {
  return {
    "@type": "OfferCatalog",
    name: "Mobile Mechanic Services",
    itemListElement: BUSINESS.serviceTypes.map((service) => ({
      "@type": "Offer",
      itemOffered: { "@type": "Service", name: service },
    })),
  };
}

/** Rich AutoRepair LocalBusiness — used on the marketing home page. */
export function autoRepairSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "AutoRepair",
    "@id": ORG_ID,
    name: BUSINESS.name,
    legalName: BUSINESS.legalName,
    description: BUSINESS.description,
    url: BUSINESS.url,
    telephone: BUSINESS.phone,
    email: BUSINESS.email,
    image: `${BUSINESS.url}/opengraph-image`,
    logo: `${BUSINESS.url}/icon`,
    priceRange: BUSINESS.priceRange,
    address: postalAddress(),
    geo: geoCoordinates(),
    openingHoursSpecification: openingHoursSpecification(),
    areaServed: areaServedCities(),
    serviceArea: {
      "@type": "GeoCircle",
      geoMidpoint: geoCoordinates(),
      geoRadius: 40000, // ~25 miles
    },
    hasOfferCatalog: offerCatalog(),
    sameAs: [BUSINESS.gmb.shareUrl, BUSINESS.gmb.mapsUrl],
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: BUSINESS.rating.value,
      reviewCount: BUSINESS.rating.count,
      bestRating: 5,
      worstRating: 1,
    },
  };
}

/** Site-wide WebSite schema with SearchAction — goes in root layout. */
export function websiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: BUSINESS.name,
    url: BUSINESS.url,
    publisher: { "@id": ORG_ID },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${BUSINESS.url}/?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}
