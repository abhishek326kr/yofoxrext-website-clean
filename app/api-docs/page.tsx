import { Metadata } from 'next';
import APIDocumentationClient from './APIDocumentationClient';

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'API Documentation | YoForex',
    description: 'YoForex API documentation for developers. Integrate YoForex data into your applications.',
    keywords: 'API, documentation, developer, integration, REST API',
    openGraph: {
      title: 'API Documentation | YoForex',
      description: 'YoForex API documentation for developers. Integrate YoForex data into your applications.',
      type: 'website',
      url: '/api-docs',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'API Documentation | YoForex',
      description: 'YoForex API documentation for developers. Integrate YoForex data into your applications.',
    },
  };
}

export default function APIDocsPage() {
  return <APIDocumentationClient />;
}
