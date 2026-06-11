"use client";

import { useState, useMemo } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────
type Level = "Débutant" | "Intermédiaire" | "Avancé" | "Expert";
type Support = "E-Learning" | "Premium 24/7" | "Live Avatar";
type Domain =
  | "IA & Tech"
  | "Bien-être"
  | "Management"
  | "Langues"
  | "Comptabilité"
  | "Marketing"
  | "Droit"
  | "Design"
  | "Finance"
  | "RH";

interface Formation {
  id: number;
  title: string;
  domain: Domain;
  duration: string;
  level: Level;
  price: number;
  support: Support;
  description: string;
  popular?: boolean;
}

// ─── Données ─────────────────────────────────────────────────────────────────
const formations: Formation[] = [
  // IA & Tech (12)
  { id: 1, title: "Introduction à l'Intelligence Artificielle", domain: "IA & Tech", duration: "20h", level: "Débutant", price: 299, support: "E-Learning", description: "Découvrez les fondamentaux de l'IA moderne", popular: true },
  { id: 2, title: "Machine Learning avec Python", domain: "IA & Tech", duration: "40h", level: "Intermédiaire", price: 499, support: "Premium 24/7", description: "Algorithmes ML et implémentation pratique" },
  { id: 3, title: "Deep Learning & Réseaux de Neurones", domain: "IA & Tech", duration: "50h", level: "Avancé", price: 699, support: "Live Avatar", description: "Architectures CNN, RNN et Transformers", popular: true },
  { id: 4, title: "Prompt Engineering Avancé", domain: "IA & Tech", duration: "15h", level: "Intermédiaire", price: 249, support: "E-Learning", description: "Maîtrisez l'art du prompt pour LLMs" },
  { id: 5, title: "IA Générative & ChatGPT Pro", domain: "IA & Tech", duration: "25h", level: "Intermédiaire", price: 399, support: "Premium 24/7", description: "Applications professionnelles de l'IA générative" },
  { id: 6, title: "Computer Vision & OpenCV", domain: "IA & Tech", duration: "35h", level: "Avancé", price: 549, support: "Live Avatar", description: "Traitement d'images et vision par ordinateur" },
  { id: 7, title: "NLP & Traitement du Langage", domain: "IA & Tech", duration: "30h", level: "Avancé", price: 499, support: "Premium 24/7", description: "Analyse textuelle et modèles de langage" },
  { id: 8, title: "MLOps & Déploiement IA", domain: "IA & Tech", duration: "28h", level: "Expert", price: 649, support: "Live Avatar", description: "Pipeline ML en production" },
  { id: 9, title: "IA pour les Métiers", domain: "IA & Tech", duration: "12h", level: "Débutant", price: 199, support: "E-Learning", description: "Intégrer l'IA dans votre quotidien pro" },
  { id: 10, title: "Automatisation RPA & IA", domain: "IA & Tech", duration: "22h", level: "Intermédiaire", price: 349, support: "Premium 24/7", description: "Automatisez vos processus avec l'IA" },
  { id: 11, title: "Data Science Appliquée", domain: "IA & Tech", duration: "45h", level: "Intermédiaire", price: 579, support: "Live Avatar", description: "Analyse de données et insights business", popular: true },
  { id: 12, title: "IA Éthique & Responsable", domain: "IA & Tech", duration: "18h", level: "Débutant", price: 279, support: "E-Learning", description: "Enjeux éthiques de l'intelligence artificielle" },

  // Bien-être (11)
  { id: 13, title: "Gestion du Stress au Travail", domain: "Bien-être", duration: "10h", level: "Débutant", price: 149, support: "E-Learning", description: "Techniques de relaxation et mindfulness", popular: true },
  { id: 14, title: "Méditation & Pleine Conscience", domain: "Bien-être", duration: "15h", level: "Débutant", price: 179, support: "Premium 24/7", description: "Pratiques méditatives pour professionnels" },
  { id: 15, title: "Yoga en Entreprise", domain: "Bien-être", duration: "12h", level: "Débutant", price: 159, support: "E-Learning", description: "Postures et respiration pour le bureau" },
  { id: 16, title: "Nutrition & Performance", domain: "Bien-être", duration: "20h", level: "Intermédiaire", price: 249, support: "Premium 24/7", description: "Alimentation optimale pour performers" },
  { id: 17, title: "Psychologie Positive", domain: "Bien-être", duration: "25h", level: "Intermédiaire", price: 299, support: "Live Avatar", description: "Développer résilience et optimisme" },
  { id: 18, title: "Sommeil & Récupération", domain: "Bien-être", duration: "8h", level: "Débutant", price: 129, support: "E-Learning", description: "Optimisez votre sommeil pour performer" },
  { id: 19, title: "Coaching Bien-être Holistique", domain: "Bien-être", duration: "30h", level: "Avancé", price: 449, support: "Live Avatar", description: "Approche globale corps-esprit", popular: true },
  { id: 20, title: "Prévention Burn-out", domain: "Bien-être", duration: "14h", level: "Intermédiaire", price: 199, support: "Premium 24/7", description: "Identifier et prévenir l'épuisement professionnel" },
  { id: 21, title: "Sophrologie Professionnelle", domain: "Bien-être", duration: "16h", level: "Débutant", price: 219, support: "E-Learning", description: "Techniques sophrologique appliquées" },
  { id: 22, title: "Intelligence Émotionnelle", domain: "Bien-être", duration: "22h", level: "Intermédiaire", price: 329, support: "Premium 24/7", description: "Maîtrisez vos émotions au quotidien" },
  { id: 23, title: "Cohérence Cardiaque", domain: "Bien-être", duration: "6h", level: "Débutant", price: 99, support: "E-Learning", description: "Régulation émotionnelle par la respiration" },

  // Management (12)
  { id: 24, title: "Leadership Transformationnel", domain: "Management", duration: "30h", level: "Avancé", price: 549, support: "Live Avatar", description: "Inspirez et transformez votre équipe", popular: true },
  { id: 25, title: "Management d'Équipe à Distance", domain: "Management", duration: "20h", level: "Intermédiaire", price: 349, support: "Premium 24/7", description: "Gérer les équipes hybrides efficacement" },
  { id: 26, title: "Conduite du Changement", domain: "Management", duration: "25h", level: "Avancé", price: 449, support: "Live Avatar", description: "Piloter la transformation organisationnelle" },
  { id: 27, title: "Agilité & Scrum Master", domain: "Management", duration: "28h", level: "Intermédiaire", price: 499, support: "Premium 24/7", description: "Méthodes agiles et certification Scrum" },
  { id: 28, title: "Gestion de Projet PMP", domain: "Management", duration: "40h", level: "Avancé", price: 649, support: "Live Avatar", description: "Préparation à la certification PMP", popular: true },
  { id: 29, title: "Management Bienveillant", domain: "Management", duration: "18h", level: "Intermédiaire", price: 299, support: "E-Learning", description: "Manager avec empathie et efficacité" },
  { id: 30, title: "Prise de Décision Stratégique", domain: "Management", duration: "22h", level: "Expert", price: 499, support: "Premium 24/7", description: "Décider vite et bien en contexte complexe" },
  { id: 31, title: "Gestion des Conflits", domain: "Management", duration: "16h", level: "Intermédiaire", price: 279, support: "E-Learning", description: "Résoudre les tensions dans votre équipe" },
  { id: 32, title: "Communication Managériale", domain: "Management", duration: "20h", level: "Débutant", price: 299, support: "Premium 24/7", description: "Communiquer avec impact et clarté" },
  { id: 33, title: "Manager Coach", domain: "Management", duration: "35h", level: "Avancé", price: 599, support: "Live Avatar", description: "Développer les talents de votre équipe" },
  { id: 34, title: "Feedback & Entretiens Pro", domain: "Management", duration: "12h", level: "Intermédiaire", price: 229, support: "E-Learning", description: "Maîtrisez l'art du feedback constructif" },
  { id: 35, title: "Vision Stratégique d'Entreprise", domain: "Management", duration: "24h", level: "Expert", price: 549, support: "Live Avatar", description: "Définir et déployer votre stratégie" },

  // Langues (11)
  { id: 36, title: "Anglais des Affaires B2", domain: "Langues", duration: "60h", level: "Intermédiaire", price: 699, support: "Live Avatar", description: "Communication professionnelle en anglais", popular: true },
  { id: 37, title: "Espagnol Professionnel A1-B1", domain: "Langues", duration: "50h", level: "Débutant", price: 549, support: "Premium 24/7", description: "Espagnol pour le milieu des affaires" },
  { id: 38, title: "Anglais TOEIC Préparation", domain: "Langues", duration: "40h", level: "Intermédiaire", price: 449, support: "Premium 24/7", description: "Préparez et décrochez votre TOEIC", popular: true },
  { id: 39, title: "Mandarin Business Débutant", domain: "Langues", duration: "45h", level: "Débutant", price: