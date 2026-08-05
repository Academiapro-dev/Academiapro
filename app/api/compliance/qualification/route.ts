import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sessionCourante } from "../../../../lib/session";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// L organisme vient du JETON SIGNE session_academia. Avec l ancien cookie
// sb_user, un cookie forge permettait de lire ET D ECRIRE les reponses de
// qualification d un autre organisme.
function tenantDeLaSession(): string | null {
  const session = sessionCourante();
  return session ? session.tenantId : null;
}

// Evalue une condition {"Qx":"valeur"} / {"ou":[...]} / {"et":[...]}
function evalCondition(cond: any, reponses: Record<string, string>): boolean {
  if (!cond || typeof cond !== "object") return false;
  if (Array.isArray(cond.ou)) return cond.ou.some((c: any) => evalCondition(c, reponses));
  if (Array.isArray(cond.et)) return cond.et.every((c: any) => evalCondition(c, reponses));
  return Object.entries(cond).every(([q, v]) => reponses[q] === v);
}

function decrireCondition(cond: any): string {
  if (!cond || typeof cond !== "object") return "";
  if (Array.isArray(cond.ou)) return cond.ou.map(decrireCondition).join(" OU ");
  if (Array.isArray(cond.et)) return cond.et.map(decrireCondition).join(" ET ");
  return Object.entries(cond).map(([q, v]) => q + "=" + v).join(" ET ");
}

export async function GET(req: NextRequest) {
  const tenantId = tenantDeLaSession();
  if (!tenantId) {
    return NextResponse.json(
      { error: "Session sans societe rattachee. Reconnectez-vous." },
      { status: 401 }
    );
  }

  try {
    // ---- Questions actives ----
    const { data: questions, error: eQ } = await supabase
      .from("compliance_qualif_questions")
      .select("code, ordre, question, options")
      .eq("actif", true)
      .order("ordre");
    if (eQ) return NextResponse.json({ error: "Questions: " + eQ.message }, { status: 500 });

    // ---- Enregistrement des reponses passees dans l'URL (?Q1=france&Q2=usa...) ----
    const aEnregistrer: Array<{ tenant_id: string; question_code: string; reponse: string }> = [];
    for (const q of questions || []) {
      const val = req.nextUrl.searchParams.get(q.code);
      if (val !== null && val !== "") {
        const optionsValides: string[] = Array.isArray(q.options) ? q.options : [];
        if (!optionsValides.includes(val)) {
          return NextResponse.json(
            { error: "Reponse invalide pour " + q.code + " : " + val + ". Options : " + optionsValides.join(", ") },
            { status: 400 }
          );
        }
        aEnregistrer.push({ tenant_id: tenantId, question_code: q.code, reponse: val });
      }
    }
    if (aEnregistrer.length > 0) {
      const { error: eUp } = await supabase
        .from("compliance_qualif_reponses")
        .upsert(aEnregistrer, { onConflict: "tenant_id,question_code" });
      if (eUp) return NextResponse.json({ error: "Enregistrement: " + eUp.message }, { status: 500 });
    }

    // ---- Reponses du tenant ----
    const { data: lignesRep, error: eR } = await supabase
      .from("compliance_qualif_reponses")
      .select("question_code, reponse")
      .eq("tenant_id", tenantId);
    if (eR) return NextResponse.json({ error: "Reponses: " + eR.message }, { status: 500 });

    const reponses: Record<string, string> = {};
    for (const l of lignesRep || []) reponses[l.question_code] = l.reponse;

    const manquantes = (questions || [])
      .filter((q) => !(q.code in reponses))
      .map((q) => ({ code: q.code, question: q.question, options: q.options }));

    // ---- Evaluation des regles ----
    const { data: regles, error: eG } = await supabase
      .from("compliance_qualif_regles")
      .select("document_code, document_lib, juridiction, condition, consequence, source, validee_par_fiscaliste")
      .eq("actif", true)
      .order("juridiction");
    if (eG) return NextResponse.json({ error: "Regles: " + eG.message }, { status: 500 });

    const obligations: any[] = [];
    const ecartes: any[] = [];
    for (const r of regles || []) {
      if (evalCondition(r.condition, reponses)) {
        obligations.push({
          code: r.document_code,
          document: r.document_lib,
          juridiction: r.juridiction,
          consequence: r.consequence,
          source: r.source,
          validee_par_fiscaliste: r.validee_par_fiscaliste,
        });
      } else {
        ecartes.push({
          code: r.document_code,
          document: r.document_lib,
          raison: "Ne s'applique pas a votre situation (condition : " + decrireCondition(r.condition) + ")",
        });
      }
    }

    return NextResponse.json({
      success: true,
      questions: (questions || []).map((q) => ({
        code: q.code,
        ordre: q.ordre,
        question: q.question,
        options: q.options,
      })),
      reponses,
      questions_manquantes: manquantes,
      nb_obligations: obligations.length,
      obligations,
      nb_ecartes: ecartes.length,
      documents_ecartes: ecartes,
      avertissement:
        "Carte etablie par regles automatiques non validees par un professionnel (drapeau validee_par_fiscaliste sur chaque regle). Ne constitue pas un avis fiscal.",
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: String(e && e.message ? e.message : e) },
      { status: 500 }
    );
  }
}
