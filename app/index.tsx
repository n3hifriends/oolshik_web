import { Redirect } from "expo-router";
import { session } from "@/lib/session";

// Entry point — bounce to dashboard or login based on stored backend tokens.
export default function Index() {
  return <Redirect href={session.hasTokens() ? "/dashboard" : "/login"} />;
}
