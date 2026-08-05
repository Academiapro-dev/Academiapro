"use client";
import { useState } from "react";

const OR = "#c8a96e";
const FOND = "#050508";
const CARTE = "#1a1a2e";

export default function EsnPage() {
  const [envoi, setEnvoi] = useState("");
  const [message, setMessage] = useState("");
  const [erreur, setErreur] = useState("");

  const [nom, setNom] = useState("");
  const [societe, setSociete] = useState("");
  const [email, setEmail] = useState("");
  const [telephone, setTelephone] = useState("");
  const [effectif, setEffectif] = useState("");
  const [certifie, setCertifie] = useState("");
  const [texte, setTexte] = useState("");
  const [piege, setPiege] = useState("");

  async function envoyer() {
    setErreur("");
    set
