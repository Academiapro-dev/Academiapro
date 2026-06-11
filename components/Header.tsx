import { useState, useEffect, useRef } from "react";

const catalogCategories = [
  {
    title: "Développement Personnel",
    items: ["Gestion du stress", "Confiance en soi", "Mindfulness", "Productivité"],
  },
  {
    title: "Thérapies & Bien-être",
    items: ["Thérapie cognitive", "Sophrologie", "Hypnose guidée", "EMDR numérique"],
  },
  {
    title: "Apprentissage",
    items: ["Méthodes d'étude", "Mémorisation", "Concentration", "Langues"],
  },
  {
    title: "Relations & Social",
    items: ["Communication", "Intelligence émotionnelle", "Couples", "Famille"],
  },
];

const navLinks = [
  { label: "Catalogue", href: "/catalogue", hasDropdown: true },
  { label: "Séances", href: "/seances", badge: "NOUVEAU" },
  { label: "Classes Live", href: "/classes-live" },
  { label: "Tarifs", href: "/tarifs" },
  { label: "Blog", href: "/blog" },
];

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [activePage, setActivePage] = useState("/catalogue");
  const [isScrolled, setIsScrolled] = useState(false);
  const [isConnected] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const catalogBtnRef = useRef<HTMLButtonElement>(null);
  const catalogTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        catalogBtnRef.current &&
        !catalogBtnRef.current.contains(e.target as Node)
      ) {
        setIsCatalogOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCatalogEnter = () => {
    if (catalogTimeoutRef.current) clearTimeout(catalogTimeoutRef.current);
    setIsCatalogOpen(true);
  };

  const handleCatalogLeave = () => {
    catalogTimeoutRef.current = setTimeout(() => setIsCatalogOpen(false), 200);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Inter:wght@300;400;500;600&display=swap');
        
        .font-playfair { font-family: 'Playfair Display', serif; }
        .font-inter { font-family: 'Inter', sans-serif; }
        
        .gold-gradient {
          background: linear-gradient(135deg, #c8a96e 0%, #e8d5a3 50%, #c8a96e 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .gold-border-gradient {
          background: linear-gradient(135deg, #c8a96e, #e8d5a3, #c8a96e);
        }
        
        .nav-link-hover::after {
          content: '';
          position: absolute;
          bottom: -2px;
          left: 0;
          width: 0;
          height: 1px;
          background: linear-gradient(90deg, #c8a96e, #e8d5a3);
          transition: width 0.3s ease;
        }
        
        .nav-link-hover:hover::after,
        .nav-link-active::after {
          width: 100%;
        }
        
        .nav-link-active::after {
          content: '';
          position: absolute;
          bottom: -2px;
          left: 0;
          width: 100%;
          height: 1px;
          background: linear-gradient(90deg, #c8a96e, #e8d5a3);
        }
        
        .dropdown-item:hover {
          background: rgba(200, 169, 110, 0.08);
        }
        
        .header-blur {
          backdrop-filter: blur(20px) saturate(180%);
          -webkit-backdrop-filter: blur(20px) saturate(180%);
        }
        
        .badge-pulse {
          animation: badgePulse 2s ease-in-out infinite;
        }
        
        @keyframes badgePulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(200, 169, 110, 0.4); }
          50% { box-shadow: 0 0 0 4px rgba(200, 169, 110, 0); }
        }
        
        .btn-primary {
          background: linear-gradient(135deg, #c8a96e 0%, #b8934a 100%);
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }
        
        .btn-primary::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent);
          transition: left 0.4s ease;
        }
        
        .btn-primary:hover::before {
          left: 100%;
        }
        
        .btn-primary:hover {
          box-shadow: 0 4px 20px rgba(200, 169, 110, 0.4);
          transform: translateY(-1px);
        }
        
        .btn-outline {
          border: 1px solid rgba(200, 169, 110, 0.4);
          transition: all 0.3s ease;
        }
        
        .btn-outline:hover {
          border-color: #c8a96e;
          background: rgba(200, 169, 110, 0.08);
          color: #e8d5a3;
        }
        
        .mobile-menu-enter {
          animation: slideDown 0.3s ease forwards;
        }
        
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .dropdown-enter {
          animation: dropdownFade 0.2s ease forwards;
        }
        
        @keyframes dropdownFade {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .logo-icon {
          background: linear-gradient(135deg, #c8a96e 0%, #e8d5a3 50%, #a07840 100%);
        }
        
        .avatar-ring {
          background: linear-gradient(135deg, #c8a96e, #e8d5a3);
          padding: 1.5px;
          border-radius: 50%;
        }
      `}</style>

      <header
        className={`fixed top-0 left-0 right-0 z-50 font-inter transition-all duration-300 ${
          isScrolled
            ? "border-b border-[rgba(200,169,110,0.12)] header-blur"
            : "border-b border-transparent"
        }`}
        style={{
          background: isScrolled
            ? "rgba(5, 5, 8, 0.92)"
            : "rgba(5, 5, 8, 0.85)",
        }}
      >
        {/* Top accent line */}
        <div
          className="h-px w-full"
          style={{
            background:
              "linear-gradient(90deg, transparent 0%, #c8a96e 30%, #e8d5a3 50%, #c8a96e 70%, transparent 100%)",
          }}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">

            {/* ── LOGO ── */}
            <a
              href="/"
              className="flex items-center gap-3 flex-shrink-0 group"
              onClick={() => setActivePage("/")}
            >
              <div className="relative">
                <div
                  className="logo-icon w-9 h-9 rounded-lg flex items-center justify-center shadow-lg"
                  style={{ boxShadow: "0 2px 12px rgba(200, 169, 110, 0.3)" }}
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path
                      d="M10 2L13 7H18L14 11L16 17L10 13L4 17L6 11L2 7H7L10 2Z"
                      fill="white"
                      fillOpacity="0.9"
                    />
                    <circle cx="10" cy="10" r="2" fill="white" fillOpacity="0.6" />
                  </svg>
                </div>
                <div
                  className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full"
                  style={{ background: "#c8a96e", boxShadow: "0 0 6px #c8a96e" }}
                />
              </div>
              <div className="flex flex-col leading-tight">
                <span
                  className="font-playfair font-bold text-xl tracking-wide gold-gradient"
                >
                  AcadémIA
                </span>
                <span
                  className="text-[10px] tracking-[0.25em] uppercase font-light"
                  style={{ color: "rgba(200, 169, 110, 0.65)" }}
                >
                  Pro
                </span>
              </div>
            </a>

            {/* ── NAVIGATION DESKTOP ── */}
            <nav className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => {
                const isActive = activePage === link.href;

                if (link.hasDropdown) {
                  return (
                    <div
                      key={link.label}
                      className="relative"
                      onMouseEnter={handleCatalogEnter}
                      onMouseLeave={handleCatalogLeave}
                    >
                      <button
                        ref={catalogBtnRef}
                        onClick={() => {
                          setActivePage(link.href);
                          setIsCatalogOpen(!isCatalogOpen);
                        }}
                        className={`relative flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-md nav-link-hover transition-colors duration-200