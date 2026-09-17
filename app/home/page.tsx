import { redirect } from "next/navigation";
import { requireUser } from "@/lib/supabase/server";
import { PersonaExperience } from "@/components/PersonaExperience";

export default async function HomePage() {
  const { supabase, user } = await requireUser();
  if (!user) redirect("/sign-in?next=/home");

  const [{ data: profile }, { data: conversations }] = await Promise.all([
    supabase.from("doc2postdoc_profiles").select("display_name, institution").eq("id", user.id).maybeSingle(),
    supabase
      .from("eyewee_conversations")
      .select("id, title, created_at, updated_at")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false }),
  ]);

  return (
    <PersonaExperience
      initialConversations={conversations ?? []}
      displayName={profile?.display_name || user.email?.split("@")[0] || ""}
      institution={profile?.institution || ""}
    />
  );
}
