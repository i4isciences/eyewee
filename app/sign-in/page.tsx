import { redirect } from "next/navigation";
import Link from "next/link";
import { AuthCard } from "@/components/AuthCard";
import { SignInForm } from "@/components/SignInForm";
import { requireUser } from "@/lib/supabase/server";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { user } = await requireUser();
  const { next } = await searchParams;
  if (user) redirect(next || "/home");

  return (
    <AuthCard
      title="Welcome back"
      subtitle="Sign in to pick up where you left off."
      footer={
        <>
          New to eyewee? <Link href="/sign-up">Create an account</Link>
        </>
      }
    >
      <SignInForm next={next || "/home"} />
    </AuthCard>
  );
}
