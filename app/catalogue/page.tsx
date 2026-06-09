```tsx
"use client";

import { useState, useMemo } from "react";

type Level = "Débutant" | "Intermédiaire" | "Avancé";
type Support = "E-Learning" | "Premium 24/7" | "Live Avatar";
type Domain =
  | "IA"
  | "Bien-être"
  | "Management"
  | "Langues"
  | "Comptabilité"
  | "Marketing"
  | "Développement"
  | "Design"
  | "Juridique"
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
  rating: number;
  students: number;
}

const FORMATIONS: Formation[] = [
  // IA
  { id: 1, title: "Introduction à l'Intelligence Artificielle", domain: "IA", duration: "12h", level: "Débutant", price: 199, support: "E-Learning", description: "Fondamentaux de l'IA moderne", rating: 4.8, students: 2341 },
  { id: 2, title: "Machine Learning avec Python", domain: "IA", duration: "24h", level: "Intermédiaire", price: 349, support: "Premium 24/7", description: "Algorithmes ML appliqués", rating: 4.9, students: 1876 },
  { id: 3, title: "Deep Learning & Réseaux de Neurones", domain: "IA", duration: "30h", level: "Avancé", price: 499, support: "Live Avatar", description: "Architecture avancée des réseaux", rating: 4.7, students: 987 },
  { id: 4, title: "ChatGPT & LLM pour Entreprises", domain: "IA", duration: "8h", level: "Débutant", price: 149, support: "E-Learning", description: "Utilisation des grands modèles de langage", rating: 4.6, students: 3210 },
  { id: 5, title: "Computer Vision & Traitement d'Images", domain: "IA", duration: "20h", level: "Avancé", price: 429, support: "Premium 24/7", description: "Vision par ordinateur avancée", rating: 4.8, students: 654 },
  { id: 6, title: "NLP - Traitement du Langage Naturel", domain: "IA", duration: "18h", level: "Intermédiaire", price: 379, support: "Live Avatar", description: "Analyse et génération de texte", rating: 4.7, students: 1234 },
  { id: 7, title: "IA Générative & Prompt Engineering", domain: "IA", duration: "10h", level: "Débutant", price: 179, support: "E-Learning", description: "Maîtriser les outils génératifs", rating: 4.9, students: 4521 },
  { id: 8, title: "MLOps & Déploiement de Modèles", domain: "IA", duration: "22h", level: "Avancé", price: 459, support: "Premium 24/7", description: "Pipeline ML en production", rating: 4.6, students: 432 },
  { id: 9, title: "IA pour la Santé", domain: "IA", duration: "16h", level: "Intermédiaire", price: 329, support: "Live Avatar", description: "Applications médicales de l'IA", rating: 4.8, students: 765 },
  { id: 10, title: "Éthique et IA Responsable", domain: "IA", duration: "6h", level: "Débutant", price: 99, support: "E-Learning", description: "IA éthique et gouvernance", rating: 4.5, students: 1876 },
  { id: 11, title: "AutoML & No-Code IA", domain: "IA", duration: "14h", level: "Débutant", price: 249, support: "Premium 24/7", description: "IA sans coder", rating: 4.7, students: 2109 },
  { id: 12, title: "Reinforcement Learning", domain: "IA", duration: "28h", level: "Avancé", price: 549, support: "Live Avatar", description: "Apprentissage par renforcement", rating: 4.9, students: 321 },

  // Bien-être
  { id: 13, title: "Méditation & Pleine Conscience", domain: "Bien-être", duration: "8h", level: "Débutant", price: 89, support: "E-Learning", description: "Pratiques de mindfulness quotidiennes", rating: 4.9, students: 5432 },
  { id: 14, title: "Gestion du Stress au Travail", domain: "Bien-être", duration: "6h", level: "Débutant", price: 79, support: "E-Learning", description: "Techniques anti-stress professionnelles", rating: 4.8, students: 6781 },
  { id: 15, title: "Yoga & Bien-être Professionnel", domain: "Bien-être", duration: "12h", level: "Débutant", price: 129, support: "Premium 24/7", description: "Yoga adapté au bureau", rating: 4.7, students: 3214 },
  { id: 16, title: "Nutrition & Performance", domain: "Bien-être", duration: "10h", level: "Intermédiaire", price: 149, support: "Live Avatar", description: "Alimentation pour la productivité", rating: 4.6, students: 2109 },
  { id: 17, title: "Sophrologie & Relaxation", domain: "Bien-être", duration: "8h", level: "Débutant", price: 99, support: "Premium 24/7", description: "Techniques sophrologiques", rating: 4.8, students: 1876 },
  { id: 18, title: "Intelligence Émotionnelle", domain: "Bien-être", duration: "14h", level: "Intermédiaire", price: 199, support: "Live Avatar", description: "Maîtriser ses émotions", rating: 4.9, students: 4321 },
  { id: 19, title: "Sleep Coaching & Récupération", domain: "Bien-être", duration: "6h", level: "Débutant", price: 69, support: "E-Learning", description: "Optimiser son sommeil", rating: 4.7, students: 7654 },
  { id: 20, title: "Burn-out : Prévention & Récupération", domain: "Bien-être", duration: "10h", level: "Intermédiaire", price: 179, support: "Premium 24/7", description: "Prévenir et guérir l'épuisement", rating: 4.9, students: 3456 },
  { id: 21, title: "Cohérence Cardiaque", domain: "Bien-être", duration: "4h", level: "Débutant", price: 49, support: "E-Learning", description: "Techniques de cohérence cardiaque", rating: 4.8, students: 9876 },
  { id: 22, title: "Psychologie Positive au Travail", domain: "Bien-être", duration: "12h", level: "Intermédiaire", price: 169, support: "Live Avatar", description: "Cultiver le bien-être professionnel", rating: 4.7, students: 2345 },
  { id: 23, title: "Thérapies Cognitivo-Comportementales", domain: "Bien-être", duration: "16h", level: "Avancé", price: 299, support: "Live Avatar", description: "TCC appliquées", rating: 4.8, students: 876 },
  { id: 24, title: "Éco-Anxiété & Résilience Climatique", domain: "Bien-être", duration: "5h", level: "Débutant", price: 59, support: "E-Learning", description: "Gérer l'anxiété environnementale", rating: 4.6, students: 1234 },

  // Management
  { id: 25, title: "Leadership Transformationnel", domain: "Management", duration: "20h", level: "Avancé", price: 449, support: "Live Avatar", description: "Leader inspirant du changement", rating: 4.9, students: 1543 },
  { id: 26, title: "Gestion d'Équipe à Distance", domain: "Management", duration: "12h", level: "Intermédiaire", price: 279, support: "Premium 24/7", description: "Manager en mode hybride", rating: 4.8, students: 3210 },
  { id: 27, title: "Communication Non Violente", domain: "Management", duration: "8h", level: "Débutant", price: 149, support: "E-Learning", description: "CNV en entreprise", rating: 4.7, students: 4567 },
  { id: 28, title: "Gestion de Projet Agile", domain: "Management", duration: "16h", level: "Intermédiaire", price: 329, support: "Premium 24/7", description: "Scrum, Kanban et méthodes agiles", rating: 4.9, students: 5432 },
  { id: 29, title: "Prise de Décision Stratégique", domain: "Management", duration: "10h", level: "Avancé", price: 399, support: "Live Avatar", description: "Décisions sous incertitude", rating: 4.8, students: 876 },
  { id: 30, title: "Coaching d'Équipe", domain: "Management", duration: "18h", level: "Avancé", price: 479, support: "Live Avatar", description: "Développer la performance collective", rating: 4.7, students: 654 },
  { id: 31, title: "Négociation & Influence", domain: "Management", duration: "14h", level: "Intermédiaire", price: 299, support: "Premium 24/7", description: "Techniques de négociation avancées", rating: 4.8, students: 2109 },
  { id: 32, title: "Management Bienveillant", domain: "Management", duration: "10h", level: "Débutant", price: 199, support: "E-Learning", description: "Humaniser le management", rating: 4.9, students: 6789 },
  { id: 33, title: "Conduite du Changement", domain: "Management", duration: "16h", level: "Avancé", price: 429, support: "Live Avatar", description: "Gérer les transformations", rating: 4.7, students: 1234 },
  { id: 34, title: "Feedback & Culture d'Amélioration", domain: "Management", duration: "8h", level: "Intermédiaire", price: 179, support: "E-Learning", description: "Instaurer une culture du feedback", rating: 4.6, students: 3456 },
  { id: 35, title: "Management de la Diversité", domain: "Management", duration: "12h", level: "Intermédiaire", price: 249, support: "Premium 24/7", description: "Inclusion et diversité en