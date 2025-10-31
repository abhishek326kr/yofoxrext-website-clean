import { Metadata } from "next";
import SubmitFeedbackClient from "./SubmitFeedbackClient";

export const metadata: Metadata = {
  title: "Submit Feedback | YoForex",
  description: "Help us improve YoForex by submitting your feedback and suggestions.",
  keywords: "feedback, suggestions, platform feedback, improvement ideas",
  openGraph: {
    title: "Submit Feedback | YoForex",
    description: "Help us improve YoForex by submitting your feedback and suggestions.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Submit Feedback | YoForex",
    description: "Help us improve YoForex by submitting your feedback and suggestions.",
  },
};

export default function SubmitFeedbackPage() {
  return <SubmitFeedbackClient />;
}
