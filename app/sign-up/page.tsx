import { redirect } from "next/navigation";
import Link from "next/link";
import { AuthCard } from "@/components/AuthCard";
import { SignUpForm } from "@/components/SignUpForm";
import { requireUser } from "@/lib/supabase/server";

export default async function SignUpPage() {
  const { user } = await requireUser();
  if (user) redirect("/home");

  return (
    <AuthCard
      title="Create your account"
      subtitle="You say it — eyewee carries it, guides it, and cracks the toughest problems."
      footer={
        <>
          Already have an account? <Link href="/sign-in">Sign in</Link>
        </>
      }
    >
      <SignUpForm />
    </AuthCard>
  );
}
