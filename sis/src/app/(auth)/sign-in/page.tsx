import { Suspense } from "react";
import SignInForm from "./sign-in-form";

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading...</div>}>
      <SignInForm />
    </Suspense>
  );
}
