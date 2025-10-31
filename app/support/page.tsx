import { Metadata } from 'next';
import ContactSupportClient from './ContactSupportClient';

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Contact Support | YoForex',
    description: 'Get help with your YoForex account. Contact our support team for assistance.',
    keywords: 'support, help, contact, customer service',
    openGraph: {
      title: 'Contact Support | YoForex',
      description: 'Get help with your YoForex account. Contact our support team for assistance.',
      type: 'website',
      url: '/support',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Contact Support | YoForex',
      description: 'Get help with your YoForex account. Contact our support team for assistance.',
    },
  };
}

export default function SupportPage() {
  return <ContactSupportClient />;
}
