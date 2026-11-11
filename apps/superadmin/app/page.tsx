import { redirect } from "next/navigation";

export default function RootPage() {
  // In a real app, check for session here
  redirect("/login");
}
