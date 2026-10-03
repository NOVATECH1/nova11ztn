import { SignIn, SignUp } from "@clerk/nextjs";
import { AuthScreen } from "./screens";

export function ClerkAuth({ signUp = false }: { signUp?: boolean }) {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) return <AuthScreen signUp={signUp} />;
  return <div className="welcome"><div className="welcome__inner" style={{maxWidth:520}}>{signUp ? <SignUp fallbackRedirectUrl="/onboarding" /> : <SignIn fallbackRedirectUrl="/" />}</div></div>;
}
