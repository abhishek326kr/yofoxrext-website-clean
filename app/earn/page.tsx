import { Metadata } from "next";
import EarnCoinsClient from "./EarnCoinsClient";

export const metadata: Metadata = {
  title: "Earn Gold Coins | YoForex",
  description: "Discover all the ways to earn gold coins on YoForex. Contribute content, help the community, and get rewarded.",
  keywords: "earn coins, rewards, gold coins, contribution, incentives",
  openGraph: {
    title: "Earn Gold Coins | YoForex",
    description: "Discover all the ways to earn gold coins on YoForex. Contribute content, help the community, and get rewarded.",
    type: "website",
    siteName: "YoForex",
  },
  twitter: {
    card: "summary_large_image",
    title: "Earn Gold Coins | YoForex",
    description: "Discover all the ways to earn gold coins on YoForex. Contribute content, help the community, and get rewarded.",
  },
};

export default function EarnCoinsPage() {
  return <EarnCoinsClient />;
}
