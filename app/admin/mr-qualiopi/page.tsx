"use client";
import MemoryButton from "@/components/MemoryButton";
import { useAgentMemory } from "@/hooks/useAgentMemory";
import { useState, useEffect, useRef } from "react";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

function formatReponse(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/#{3} (.+)/g, "<h4 style=\"color:#c8a96e;margin:12px 0 6px;\">$1</h4>")
    .replace(/#{2} (.+)/g, "<h3 style=\"color:#c8a96e;margin:15px 0 8px;\">$1</h3>")
    .replace(/# (.+)/g, "<h2 style=\"color:#c8a96e;margin:18px 0 10px;\">$1</h2>")
    .replace(/^- (.+)/gm, "<li style=\"margin:4px 0;\">$1</li>")
    .replace(/---/g, "<hr style=\"border-color:rgba(200,169,110,0.2);margin:10px 0;\">")
    .replace(/\n\n/g, "<br/><br/>")
    .replace(/\n/g, "<br/>");
}

async function callAgent(message: string, systemPrompt: string, historique: any[] = []) {
  const res = await fetch("/api/admin/agent", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      agent: { prompt: systemPrompt },
      historique
    }),
  });
  const data = await res.json();
  return data.reply || "";
}

async function sauvegarder(table: string, payload: any) {
  await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      Prefer: "return=minimal"
    },
    body: JSON.stringify(payload),
  }
      <MemoryButton
        agentId="qualiopi"
        onRestore={restoreSession}
        onSaveNow={saveMemory}
        lastSaved={lastSaved}
        isSaving={isSaving}
      />
    );
}