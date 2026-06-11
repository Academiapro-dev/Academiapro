// app/layout.tsx
import type { Metadata } from "next";
import { Georgia } from "next/font/google";
import "./globals.css";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import SessionProviderWrapper from "@/components/providers/SessionProviderWrapper";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

const georgia = Georgia({
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
  variable: "--font-georgia",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "AcadémIA Pro",
    template: "%s · AcadémIA Pro",
  },
  description:
    "La plateforme formation professionnelle 100% IA · 127 formations · agents IA 24h/24",
  keywords: [
    "formation professionnelle",
    "intelligence artificielle",
    "apprentissage IA",
    "formations en ligne",
    "agents IA",
    "AcadémIA Pro",
  ],
  authors: [{ name: "AcadémIA Pro" }],
  creator: "AcadémIA Pro",
  publisher: "AcadémIA Pro",
  metadataBase: new URL("https://academia-pro.fr"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: "https://academia-pro.fr",
    siteName: "AcadémIA Pro",
    title: "AcadémIA Pro",
    description:
      "La plateforme formation professionnelle 100% IA · 127 formations · agents IA 24h/24",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "AcadémIA Pro",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AcadémIA Pro",
    description:
      "La plateforme formation professionnelle 100% IA · 127 formations · agents IA 24h/24",
    images: ["/og-image.png"],
    creator: "@academiapro",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="fr" className="dark" suppressHydrationWarning>
      <body
        className={`${georgia.variable} font-georgia bg-slate-950 text-slate-100 antialiased min-h-screen flex flex-col`}
      >
        <SessionProviderWrapper session={session}>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </SessionProviderWrapper>
      </body>
    </html>
  );
}
```

```tsx
// app/globals.css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --font-georgia: 'Georgia', serif;
  }

  * {
    @apply border-slate-800;
  }

  html {
    @apply scroll-smooth;
  }

  body {
    @apply bg-slate-950 text-slate-100;
    font-family: var(--font-georgia), Georgia, 'Times New Roman', serif;
  }

  ::selection {
    @apply bg-violet-600 text-white;
  }

  ::-webkit-scrollbar {
    @apply w-2;
  }

  ::-webkit-scrollbar-track {
    @apply bg-slate-900;
  }

  ::-webkit-scrollbar-thumb {
    @apply bg-violet-700 rounded-full;
  }

  ::-webkit-scrollbar-thumb:hover {
    @apply bg-violet-500;
  }
}

@layer utilities {
  .font-georgia {
    font-family: var(--font-georgia), Georgia, 'Times New Roman', serif;
  }

  .text-gradient {
    @apply bg-gradient-to-r from-violet-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent;
  }

  .glass {
    @apply bg-slate-900/60 backdrop-blur-xl border border-slate-800/60;
  }

  .glow-violet {
    box-shadow: 0 0 20px rgba(139, 92, 246, 0.3);
  }

  .glow-violet-lg {
    box-shadow: 0 0 40px rgba(139, 92, 246, 0.4);
  }
}
```

```tsx
// components/providers/SessionProviderWrapper.tsx
"use client";

import { SessionProvider } from "next-auth/react";
import type { Session } from "next-auth";

interface SessionProviderWrapperProps {
  children: React.ReactNode;
  session: Session | null;
}

export default function SessionProviderWrapper({
  children,
  session,
}: SessionProviderWrapperProps) {
  return (
    <SessionProvider
      session={session}
      refetchInterval={5 * 60}
      refetchOnWindowFocus={true}
    >
      {children}
    </SessionProvider>
  );
}
```

```tsx
// components/layout/Header.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  Brain,
  BookOpen,
  Users,
  BarChart3,
  Sparkles,
  Menu,
  X,
  ChevronDown,
  LogOut,
  User,
  Settings,
  Bell,
  Zap,
  GraduationCap,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
  children?: {
    label: string;
    href: string;
    description: string;
    icon: React.ReactNode;
  }[];
}

const navItems: NavItem[] = [
  {
    label: "Formations",
    href: "/formations",
    icon: <BookOpen className="w-4 h-4" />,
    children: [
      {
        label: "Catalogue complet",
        href: "/formations",
        description: "127 formations disponibles",
        icon: <GraduationCap className="w-5 h-5 text-violet-400" />,
      },
      {
        label: "Nouveautés IA",
        href: "/formations/nouveautes",
        description: "Dernières formations ajoutées",
        icon: <Sparkles className="w-5 h-5 text-purple-400" />,
      },
      {
        label: "Parcours certifiants",
        href: "/formations/parcours",
        description: "Obtenez votre certification",
        icon: <Zap className="w-5 h-5 text-indigo-400" />,
      },
    ],
  },
  {
    label: "Agents IA",
    href: "/agents",
    icon: <Brain className="w-4 h-4" />,
    children: [
      {
        label: "Agents tuteurs",
        href: "/agents/tuteurs",
        description: "Accompagnement personnalisé 24h/24",
        icon: <Brain className="w-5 h-5 text-violet-400" />,
      },
      {
        label: "Coach carrière",
        href: "/agents/coach",
        description: "Orientez votre évolution pro",
        icon: <BarChart3 className="w-5 h-5 text-purple-400" />,
      },
    ],
  },
  {
    label: "Communauté",
    href: "/communaute",
    icon: <Users className="w-4 h-4" />,
  },
  {
    label: "Tarifs",
    href: "/tarifs",
    icon: <BarChart3 className="w-4 h-4" />,
  },
];

function NavDropdown({
  item,
  isActive,
}: {
  item: NavItem;
  isActive: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!item.children) {
    return (
      <Link
        href={item.href}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
          isActive
            ? "text-violet-400 bg-violet-950/50"
            : "text-slate-300 hover:text-violet-300 hover:bg-slate-800/60"
        }`}
      >
        {item.icon}
        {item.label}
      </Link>
    );
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
          isActive || open
            ? "text-violet-400 bg-violet-950/50"
            : "text-slate-300 hover:text-violet-300 hover:bg-slate-800/60"
        }`}
      >
        {item.icon}
        {item.label}
        <ChevronDown
          className={`w-3.5 h-3.5 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-2 w-72 glass rounded-xl shadow-2xl shadow-black/50 overflow-hidden z-50 animate-in fade-in-0 slide-in-from-top-2 duration-200">
          <div className="p-2">
            {item.children.map((child) => (
              <Link
                key={child.href}
                href={child.href}
                onClick={() => setOpen(false)}
                className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-800/70 transition-colors duration-150 group"
              >
                <div className="mt-0.5 p-2 bg-slate-800 rounded-lg group-hover:bg-slate-700 transition-colors">
                  {child.icon}