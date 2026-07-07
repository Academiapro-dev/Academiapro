// Mesure des appels IA - retro-portage HebrewPro.
// Regle : la mesure ne bloque JAMAIS le service.
// Ecrit dans la table usage_ia via l API REST Supabase
// (cle service role, cote serveur uniquement).

type Usage = {
  route: string;
  modele?: string;
  tokens_entree?: number;
  tokens_cache_lecture?: number;
  tokens_cache_ecriture?: number;
  tokens_sortie?: number;
  utilisateur_id?: string | null;
};

export async function enregistrerUsage(u: Usage) {
  try {
    const url =
      process.env.NEXT_PUBLIC_SUPABASE_URL
      || process.env.SUPABASE_URL
      || "";
    const cle =
      process.env.SUPABASE_SERVICE_ROLE_KEY
      || "";
    if (!url || !cle) return;
    await fetch(url + "/rest/v1/usage_ia", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: cle,
        Authorization: "Bearer " + cle,
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        route: u.route,
        modele: u.modele || null,
        tokens_entree: u.tokens_entree || 0,
        tokens_cache_lecture:
          u.tokens_cache_lecture || 0,
        tokens_cache_ecriture:
          u.tokens_cache_ecriture || 0,
        tokens_sortie: u.tokens_sortie || 0,
        utilisateur_id: u.utilisateur_id || null,
      }),
    });
  } catch (e) {
    // silencieux : la mesure ne bloque jamais
  }
}

// Extrait les compteurs de la reponse Anthropic
// (data.usage) et les enregistre.
export function mesurer(
  route: string,
  data: any,
  utilisateur_id?: string | null,
) {
  const u = (data && data.usage) || {};
  void enregistrerUsage({
    route,
    modele: data && data.model,
    tokens_entree: u.input_tokens,
    tokens_cache_lecture:
      u.cache_read_input_tokens,
    tokens_cache_ecriture:
      u.cache_creation_input_tokens,
    tokens_sortie: u.output_tokens,
    utilisateur_id: utilisateur_id || null,
  });
}
