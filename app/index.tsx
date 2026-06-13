import { Redirect } from "expo-router";
import { session } from "@/lib/session";

// Entry point — bounce to dashboard or login based on session flag.
export default function Index() {
  return <Redirect href={session.isLoggedIn() ? "/dashboard" : "/login"} />;
}
