import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    default: 'Dashboard - YoForex',
    template: '%s | Dashboard - YoForex',
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
