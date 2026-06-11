"use client";

import { useState, useEffect, useRef, useCallback } from "react";

// ============================================================
// TYPES
// ============================================================
interface Formation {
  id: string;
  title: string;
  category: string;
  level: string;
  duration: string;
  modules: number;
  image: string;
  description: string;
  module1: Module1Content;
  rating: number;
  students: number;
}

interface Module1Content {
  title: string;
  lessons: Lesson[];
  audioPreview: string;
  objectives: string[];
  nextModuleTeaser: string;
}

interface Lesson {
  id: string;
  title: string;
  duration: string;
  content: string;
  type: "video" | "text" | "quiz";
}

interface UserSession {
  email: string;
  startTime: number;
  formationId: string;
  behavior: BehaviorData;
}

interface BehaviorData {
  timeSpent: number;
  lessonsViewed: string[];
  scrollDepth: number;
  chatMessages: number;
  audioPlayed: boolean;
  modulesCompleted: number;
  clicksOnUpgrade: number;
  lastActivity: number;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

// ============================================================
// DATA
// ============================================================
const formations: Formation[] = [
  {
    id: "ia-marketing",
    title: "IA & Marketing Digital",
    category: "Marketing",
    level: "Débutant",
    duration: "12h",
    modules: 8,
    image: "🎯",
    description:
      "Maîtrisez l'intelligence artificielle pour transformer vos stratégies marketing et décupler vos résultats.",
    rating: 4.9,
    students: 3847,
    module1: {
      title: "Fondamentaux de l'IA en Marketing",
      objectives: [
        "Comprendre les bases de l'IA appliquée au marketing",
        "Identifier les outils IA incontournables en 2024",
        "Créer votre première campagne assistée par IA",
        "Analyser les données avec des algorithmes prédictifs",
      ],
      audioPreview:
        "Bienvenue dans cette séance découverte. Aujourd'hui, nous allons explorer comment l'intelligence artificielle révolutionne le marketing digital...",
      nextModuleTeaser:
        "Dans le Module 2, vous apprendrez à créer des personas ultra-précis grâce au machine learning et à automatiser l'ensemble de votre funnel de vente.",
      lessons: [
        {
          id: "l1",
          title: "Introduction : L'IA qui change tout",
          duration: "18 min",
          type: "video",
          content: `## L'Intelligence Artificielle en Marketing : La Révolution Silencieuse

L'IA n'est plus une technologie du futur — elle transforme le marketing **dès aujourd'hui**. Les entreprises qui l'adoptent observent en moyenne une augmentation de **37% de leur ROI** dans les 6 premiers mois.

### Pourquoi maintenant ?

**1. L'explosion des données** : En 2024, nous générons 2,5 quintillions d'octets de données par jour. L'IA est le seul outil capable d'en extraire de la valeur en temps réel.

**2. La personnalisation à l'échelle** : Netflix économise 1 milliard de dollars par an grâce à ses algorithmes de recommandation. Amazon génère 35% de ses revenus via l'IA prédictive.

**3. L'automatisation intelligente** : Les tâches répétitives — rédaction d'emails, A/B testing, segmentation — peuvent être automatisées à 80%, libérant votre créativité.

### Les 3 Piliers de l'IA Marketing

**Pilier 1 — Prédiction** : Anticiper le comportement des consommateurs avant qu'ils agissent. Les modèles prédictifs permettent d'intervenir au bon moment, avec le bon message.

**Pilier 2 — Personnalisation** : Créer des expériences uniques pour chaque utilisateur à grande échelle. L'hyper-personnalisation augmente les conversions de 202% selon McKinsey.

**Pilier 3 — Automation** : Orchestrer des campagnes complexes sans intervention humaine continue. L'IA optimise en permanence, 24h/24, 7j/7.

### Exercice Pratique

Identifiez dans votre business actuel **3 tâches marketing chronophages** que vous effectuez chaque semaine. Ce sont vos premières cibles d'automatisation IA.`,
        },
        {
          id: "l2",
          title: "Les outils IA essentiels en 2024",
          duration: "22 min",
          type: "text",
          content: `## Cartographie des Outils IA Marketing 2024

### Catégorie 1 : Création de Contenu

**ChatGPT-4 / Claude** — Rédaction d'articles, emails, scripts publicitaires. ROI moyen : 5h économisées par semaine.

**Midjourney / DALL-E 3** — Création visuels publicitaires en minutes. Coût réduit de 70% vs graphiste traditionnel.

**ElevenLabs** — Voix synthétiques ultra-réalistes pour vos podcasts, publicités audio, vidéos de formation.

### Catégorie 2 : Analyse & Intelligence

**Google Analytics 4 + IA** — Prédictions de churn, analyse comportementale automatique, recommandations d'actions.

**Hotjar AI** — Analyse automatique des heatmaps, détection des points de friction, suggestions d'optimisation.

**Brandwatch** — Veille concurrentielle et analyse sentiment en temps réel sur les réseaux sociaux.

### Catégorie 3 : Publicité Automatisée

**Meta Advantage+** — Ciblage automatique par IA, allocation budgétaire dynamique, création d'audiences similaires.

**Google Performance Max** — Campagnes cross-canal optimisées par machine learning avec enchères intelligentes.

**Smartly.io** — Automation créative : génère et teste des milliers de variantes publicitaires automatiquement.

### Catégorie 4 : CRM & Personnalisation

**HubSpot IA** — Scoring leads automatique, prédiction de closing, personnalisation email à grande échelle.

**Salesforce Einstein** — Recommandations produits en temps réel, analyse prédictive du parcours client.

### Stack Recommandé pour Débuter (Budget < 200€/mois)

1. ChatGPT Plus — 20€/mois
2. Midjourney Basic — 10€/mois  
3. HubSpot Starter — 45€/mois
4. Canva Pro (avec IA) — 13€/mois

**Total : 88€/mois pour multiplier votre productivité par 3.**`,
        },
        {
          id: "l3",
          title: "Quiz : Évaluez vos connaissances",
          duration: "10 min",
          type: "quiz",
          content: `## Quiz de Validation — Module 1

Testez votre compréhension des fondamentaux IA Marketing.

**Question 1** : Selon les données présentées, quelle est l'augmentation moyenne du ROI observée par les entreprises adoptant l'IA dans les 6 premiers mois ?
→ **Réponse : 37%**

**Question 2** : Quels sont les 3 piliers de l'IA Marketing ?
→ **Réponse : Prédiction, Personnalisation, Automation**

**Question 3** : Quel pourcentage des revenus Amazon est généré via l'IA prédictive ?
→ **Réponse : 35%**

**Question 4** : Quel outil IA de CRM utilise le "scoring leads automatique" ?
→ **Réponse : HubSpot IA**

**Question 5** : Dans le stack recommandé pour débuter, quel est le budget mensuel total ?
→ **Réponse : 88€/mois**

### Votre Score : Calculé automatiquement

✅ 5/5 — Excellent ! Vous maîtrisez les bases. Prêt pour le Module 2.
✅ 4/5 — Très bien ! Relisez le point sur les outils.
⚠️ 3/5 ou moins — Recommencez la leçon 2 avant de continuer.`,
        },
      ],
    },
  },
  {
    id: "leadership-ia",
    title: "Leadership à l'Ère de l'IA",
    category: "Management",
    level: "Intermédiaire",
    duration: "15h",
    modules: 10,
    image: "🧠",
    description:
      "Développez les compétences de leadership essentielles pour diriger des équipes augmentées par l'intelligence artificielle.",
    rating: 4.8,
    students: 2156,
    module1: {
      title: "Le Leader Augmenté : Nouvelle Définition",
      objectives: [
        "Redéfinir le leadership à l'ère digitale",
        "Comprendre l'impact de l'IA sur les équipes",
        "Développer votre intelligence émotionnelle augmentée",
        "Créer une culture d'innovation IA dans votre organisation",
      ],
      audioPreview:
        "Dans cette séance découverte sur le leadership augmenté, nous explorons comment les meilleurs dirigeants du monde utilisent l'IA comme levier de performance...",
      nextModuleTeaser:
        "Le Module 2 vous plonge dans la gestion du changement : comment faire adopter l'IA à votre équipe sans résistance et créer un momentum d'innovation durable.",
      lessons: [
        {
          id: "l1",
          title: "Redéfinir le leadership pour 2024-2030",
          duration: "20 min",
          type: "text",
          content: `## Le Leader Augmenté : Paradigme du XXIe Siècle

Le leadership traditionnel est mort. Vive le **Leadership Augmenté**.

### La Transformation en Chiffres

- **85% des emplois** de 2030 n'existent pas encore (Institut pour le Futur)
- Les leaders qui intègrent l'IA prennent des décisions **60% plus rapidement**
- Les équipes dirigées par des leaders "IA-aware" sont **40% plus productives**

### Les 5 Compétences du Leader Augmenté

**1. Data Literacy** : Comprendre et interpréter les insights générés par l'IA. Vous n'avez pas besoin de coder — mais vous devez savoir poser les bonnes questions aux données.

**2. Human-AI Collaboration** : Orchestrer la collaboration entre humains et systèmes IA. Savoir quand faire confiance à l'algorithme, quand l'overrider.

**3. Sens-Making** : Dans un monde d'information abondante, votre valeur réside dans votre capacité à donner du sens, à construire le récit.

**4. Adaptabilité Radicale** : La durée de vie moyenne d'une compétence est passée de 30 ans à 4 ans. L'apprentissage continu n'