import { createClient } from "@supabase/supabase-js";
import FormationsClient from "./FormationsClient";

export default async function FormationsPage() {
  let formations: any[] = [];
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data } = await supabase
      .from("formations")
      .select("code, titre, domaine, niveau, prix, duree")
      .eq("actif", true)
      .order("code", { ascending: true });
    if (data && data.length > 0) formations = data;
  } catch (e) {}

  return <FormationsClient formations={formations} />;
}

export const dynamic = "force-dynamic";
