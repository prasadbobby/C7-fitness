import { redirect } from "next/navigation";

export default async function CommunityPage() {
  // Community posts are now integrated into individual 90-day challenges
  // Redirect to the main ninety-day-challenge page
  redirect("/ninety-day-challenge");
}