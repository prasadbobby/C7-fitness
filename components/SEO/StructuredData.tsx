export default function StructuredData() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "C7 Personal Fitness Studio",
    "alternateName": "C7 Fitness App",
    "description": "The ultimate fitness tracking app for serious athletes. Track workouts, join 90-day challenges, and achieve your fitness goals with comprehensive analytics.",
    "url": "https://c7personalfitness.com",
    "applicationCategory": "HealthApplication",
    "operatingSystem": "Web, iOS, Android",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD",
      "availability": "https://schema.org/InStock"
    },
    "creator": {
      "@type": "Organization",
      "name": "C7 Personal Fitness Studio",
      "url": "https://c7personalfitness.com"
    },
    "featureList": [
      "Workout Tracking",
      "Exercise Database",
      "Progress Analytics",
      "90-Day Challenges",
      "Fitness Community",
      "Body Measurements",
      "Workout Planning",
      "Performance Insights"
    ],
    "screenshot": "https://c7personalfitness.com/og-image.jpg",
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "ratingCount": "150",
      "bestRating": "5",
      "worstRating": "1"
    },
    "review": [
      {
        "@type": "Review",
        "author": {
          "@type": "Person",
          "name": "Fitness Enthusiast"
        },
        "reviewRating": {
          "@type": "Rating",
          "ratingValue": "5",
          "bestRating": "5"
        },
        "reviewBody": "Amazing fitness tracking app! The 90-day challenges keep me motivated and the analytics help me track my progress perfectly."
      }
    ]
  };

  const organizationData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "C7 Personal Fitness Studio",
    "alternateName": "C7 Fitness",
    "url": "https://c7personalfitness.com",
    "logo": "https://c7personalfitness.com/logo.png",
    "description": "C7 Personal Fitness Studio provides comprehensive fitness tracking solutions for athletes and fitness enthusiasts.",
    "foundingDate": "2024",
    "industry": "Fitness Technology",
    "serviceArea": {
      "@type": "Place",
      "name": "Worldwide"
    },
    "services": [
      {
        "@type": "Service",
        "name": "Workout Tracking",
        "description": "Comprehensive workout logging and tracking system"
      },
      {
        "@type": "Service",
        "name": "Fitness Challenges",
        "description": "90-day fitness challenges and community programs"
      },
      {
        "@type": "Service",
        "name": "Progress Analytics",
        "description": "Detailed fitness analytics and progress tracking"
      }
    ]
  };

  const breadcrumbData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://c7personalfitness.com"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Dashboard",
        "item": "https://c7personalfitness.com/dashboard"
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": "Workouts",
        "item": "https://c7personalfitness.com/workout"
      },
      {
        "@type": "ListItem",
        "position": 4,
        "name": "90-Day Challenge",
        "item": "https://c7personalfitness.com/ninety-day-challenge"
      }
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationData),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbData),
        }}
      />
    </>
  );
}