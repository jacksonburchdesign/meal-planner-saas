import React, { useState, useMemo } from 'react';
import { Outlet, useNavigate, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookStack,
  Sparks,
  Community,
  CalendarCheck,
  Cart,
  Apple, AppleHalf, PizzaSlice, Cookie, HalfCookie, CoffeeCup, Cutlery, Fridge, IceCream, BreadSlice, Egg, Fish
} from 'iconoir-react';

// ─── Types and Features config ──────────────────────────────────────────────────
interface Feature {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
}

const FEATURES: Feature[] = [
  {
    id: 'import',
    label: 'Import Recipes',
    description:
      "Add recipes 4 ways: type them manually, paste a URL (we parse ingredients, steps & the hero image automatically), sync a Pinterest board (up to 50 pins), or snap a photo of a recipe card.",
    icon: <BookStack width={18} height={18} strokeWidth={2} />,
  },
  {
    id: 'ai',
    label: 'AI Assisted',
    description:
      "Our AI builds a personalized 7-day meal plan tailored to your family's size, recipes, and 30-day history, parses handwritten recipes intelligently, and more!",
    icon: <Sparks width={18} height={18} strokeWidth={2} />,
  },
  {
    id: 'sharing',
    label: 'Family Sharing',
    description:
      'Share your recipe library with other chosen families and share recipes across households.',
    icon: <Community width={18} height={18} strokeWidth={2} />,
  },
  {
    id: 'mealplan',
    label: '7-Day Meal Plan',
    description:
      'A full week of dinners generated in seconds. Swap any meal with a single tap, mark meals as completed or skipped!',
    icon: <CalendarCheck width={18} height={18} strokeWidth={2} />,
  },
  {
    id: 'shopping',
    label: 'Automated Shopping List',
    description:
      'Your grocery list is auto-built from the meal plan and updates in real time as you make changes!',
    icon: <Cart width={18} height={18} strokeWidth={2} />,
  },
];

// ─── Component Definitions ──────────────────────────────────────────────────────

const FLOATING_ICONS = [
  Apple, AppleHalf, PizzaSlice, Cookie, HalfCookie, CoffeeCup, Cutlery, Fridge, IceCream, BreadSlice, Egg, Fish
];

function FloatingBackground() {
  const items = useMemo(() => {
    const cols = 4;
    const rows = 3;

    return FLOATING_ICONS.map((Icon, i) => {
      // Assign each icon to a specific cell in a 4x3 grid (12 total cells)
      const col = i % cols;
      const row = Math.floor(i / cols);

      const cellWidth = 100 / cols; // 25%
      const cellHeight = 100 / rows; // 33.3%

      // Base their starting position firmly inside their generated grid quadrant
      // Using buffers (0.1 to 0.9) so they stay off absolute grid lines
      const startX = col * cellWidth + (cellWidth * 0.1) + Math.random() * (cellWidth * 0.8);
      const startY = row * cellHeight + (cellHeight * 0.1) + Math.random() * (cellHeight * 0.8);

      return {
        Icon,
        id: i,
        startX,
        startY,
        size: 60 + Math.random() * 70, // 60px to 130px
        opacity: 0.02 + Math.random() * 0.04,
        duration: 100 + Math.random() * 100, // Very slow, 100-200s
        delay: Math.random() * -100,
        // Short tether: only drift slightly (max +/- 120 pixels) so they never cross into another icon's zone heavily
        pathX: [0, (Math.random() - 0.5) * 140, (Math.random() - 0.5) * 140, 0],
        pathY: [0, (Math.random() - 0.5) * 140, (Math.random() - 0.5) * 140, 0],
        rotation: [0, Math.random() > 0.5 ? 180 : -180, Math.random() > 0.5 ? 360 : -360]
      };
    });
  }, []);

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
      {items.map(item => (
        <motion.div
           key={item.id}
           style={{
             position: 'absolute',
             top: `${item.startY}%`,
             left: `${item.startX}%`,
             color: '#1f60a8',
             opacity: item.opacity,
           }}
           animate={{
             x: item.pathX,
             y: item.pathY,
             rotate: item.rotation,
           }}
           transition={{
             duration: item.duration,
             delay: item.delay,
             repeat: Infinity,
             ease: 'linear'
           }}
        >
          <item.Icon width={item.size} height={item.size} strokeWidth={1} />
        </motion.div>
      ))}
    </div>
  );
}

function FeatureCard({
  feature,
  isExpanded,
  isMini,
  onClick,
}: {
  feature: Feature;
  isExpanded: boolean;
  isMini: boolean;
  onClick: () => void;
}) {
  return (
    <motion.div
      animate={{
        backgroundColor: isExpanded
          ? 'rgba(255, 255, 255, 0.28)'
          : isMini
            ? 'rgba(255, 255, 255, 0.06)'
            : 'rgba(255, 255, 255, 0.10)',
        borderColor: isExpanded
          ? 'rgba(255, 255, 255, 0.60)'
          : isMini
            ? 'rgba(255, 255, 255, 0.14)'
            : 'rgba(255, 255, 255, 0.22)',
        boxShadow: isExpanded
          ? '0 8px 32px rgba(30, 80, 160, 0.14), inset 0 1px 0 rgba(255,255,255,0.5)'
          : '0 2px 8px rgba(30, 80, 160, 0.06), inset 0 1px 0 rgba(255,255,255,0.3)',
      }}
      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
      style={{
        borderRadius: 16,
        border: '1px solid rgba(255,255,255,0.22)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        overflow: 'hidden',
        cursor: 'pointer',
        flexShrink: 0,
      }}
      whileHover={{
        backgroundColor: isExpanded
          ? 'rgba(255, 255, 255, 0.28)'
          : 'rgba(255, 255, 255, 0.17)',
      }}
      onClick={onClick}
    >
      <motion.div
        animate={{ padding: isMini ? '8px 16px' : '14px 18px' }}
        transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          userSelect: 'none',
        }}
      >
        <motion.div
          animate={{
            width: isMini ? 26 : 36,
            height: isMini ? 26 : 36,
            borderRadius: isMini ? 7 : 10,
            backgroundColor: isExpanded
              ? 'rgba(74, 158, 237, 0.28)'
              : 'rgba(74, 158, 237, 0.14)',
            color: isExpanded ? '#0d2540' : '#1a3a5c',
            opacity: isMini ? 0.6 : 1,
          }}
          transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {feature.icon}
        </motion.div>

        <motion.span
          animate={{
            fontSize: isMini ? '1rem' : '1.2rem',
            color: isMini ? '#5a89b0' : isExpanded ? '#0d2540' : '#1a3a5c',
            opacity: isMini ? 0.75 : 1,
          }}
          transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
          style={{
            flex: 1,
            fontFamily: '"League Spartan", system-ui, sans-serif',
            fontWeight: 700,
            letterSpacing: '-0.02em',
            lineHeight: 1.2,
          }}
        >
          {feature.label}
        </motion.span>

        <motion.div
          animate={{
            rotate: isExpanded ? 45 : 0,
            opacity: isMini ? 0.3 : 1,
            scale: isMini ? 0.8 : 1,
          }}
          transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
          style={{
            width: 22,
            height: 22,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            color: isExpanded ? '#0d2540' : '#1a3a5c',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <line x1="8" y1="1" x2="8" y2="15" />
            <line x1="1" y1="8" x2="15" y2="8" />
          </svg>
        </motion.div>
      </motion.div>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            key="desc"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ height: 1, backgroundColor: 'rgba(74, 158, 237, 0.18)', margin: '0 18px' }} />
            <p
              style={{
                margin: 0,
                padding: '12px 18px 16px 66px',
                color: '#1e4a78',
                fontSize: '0.88rem',
                lineHeight: 1.7,
                fontWeight: 500,
              }}
            >
              {feature.description}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function FeatureSection() {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleToggle = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
      {FEATURES.map((feature) => (
        <FeatureCard
          key={feature.id}
          feature={feature}
          isExpanded={expandedId === feature.id}
          isMini={!!expandedId && expandedId !== feature.id}
          onClick={() => handleToggle(feature.id)}
        />
      ))}
    </div>
  );
}

// ─── Storefront Shared Layout ──────────────────────────────────────────────────
export default function StorefrontLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div
      style={{
        minHeight: '100dvh',
        width: '100%',
        backgroundColor: '#d6eaf8',
        backgroundImage: 'radial-gradient(ellipse at 25% 15%, #bdddf5 0%, #d6eaf8 45%, #c5dcf0 100%)',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: '"Inter", ui-sans-serif, system-ui, sans-serif',
        overflowX: 'hidden',
        boxSizing: 'border-box',
        position: 'relative',
      }}
    >
      <FloatingBackground />

      {/* Header */}
      <header
        className="landing-header"
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
          position: 'relative',
          zIndex: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <img src="/meal-planner-logo.svg" alt="MealHouse Logo" style={{ height: 56, width: 56 }} />
          <span
            style={{
              fontFamily: '"League Spartan", system-ui, sans-serif',
              fontSize: '1.8rem',
              fontWeight: 800,
              color: '#2057a0',
              letterSpacing: '0.02em',
              lineHeight: 1,
            }}
          >
            MEALHOUSE<span style={{ color: '#4a9eed' }}>.app</span>
          </span>
        </div>

        <motion.button
          id="sign-in-cta"
          onClick={() => navigate('/auth')}
          whileHover={{ scale: 1.04, backgroundColor: 'rgba(255,255,255,0.4)', borderRadius: 100 }}
          whileTap={{ scale: 0.97 }}
          transition={{ duration: 0.18 }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 22px',
            backgroundColor: 'transparent',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '2px solid rgba(26,58,92,0.15)',
            borderRadius: 100,
            color: '#1a3a5c',
            fontSize: '1.05rem',
            fontWeight: 700,
            fontFamily: '"League Spartan", system-ui, sans-serif',
            cursor: 'pointer',
            letterSpacing: '0.02em',
          }}
        >
          Sign In / Sign Up
        </motion.button>
      </header>

      {/* Main Grid: Left Side changes (Outlet), Right Side static (Features) */}
      <main
        className="landing-main"
        style={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'row',
          padding: '0 48px 24px',
          alignItems: 'center',
          position: 'relative',
          zIndex: 10,
        }}
      >
        {/* Left Side (Dynamic Content wrapper via Framer Motion) */}
        <div style={{ flex: 1, display: 'grid', marginRight: 24, placeItems: 'center' }} className="dynamic-outlet-container">
          <AnimatePresence>
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, filter: 'blur(16px)' }}
              animate={{ opacity: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, filter: 'blur(16px)' }}
              transition={{ duration: 0.8, ease: 'easeInOut' }}
              style={{
                gridArea: '1 / 1 / 2 / 2',
                width: '100%',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Right Side (Static Features) */}
        <div
          className="static-features-container"
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            height: '100%',
            overflow: 'hidden',
            width: 'clamp(320px, 30vw, 440px)',
            flexShrink: 0
          }}
        >
          <FeatureSection />
        </div>
      </main>

      {/* Footer */}
      <footer
        className="landing-footer"
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 48px',
          flexShrink: 0,
          position: 'relative',
          zIndex: 10,
          fontSize: '0.85rem',
          color: '#5a89b0',
          borderTop: '1px solid rgba(80, 140, 200, 0.15)',
        }}
      >
        <div className="footer-links" style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <span>&copy; {new Date().getFullYear()} MealHouse. All rights reserved.</span>
          <span style={{ opacity: 0.5 }}>|</span>
          <Link to="/privacy" style={{ color: '#5a89b0', textDecoration: 'none' }}>Privacy Policy</Link>
          <Link to="/terms" style={{ color: '#5a89b0', textDecoration: 'none' }}>Terms of Service</Link>
        </div>
        <div className="footer-creator">
          Created by:{' '}
          <a href="https://jacksonburch.cloud/mealhouse" target="_blank" rel="noopener noreferrer" style={{ color: '#1f60a8', textDecoration: 'none', fontWeight: 600 }}>
            Jackson Burch
          </a>
        </div>
      </footer>

      {/* Shared Responsive CSS */}
      <style>{`
        .landing-header {
          padding: 16px 44px;
        }
        @media (max-width: 900px) {
          .landing-header {
            padding: 16px 24px;
          }
          .landing-footer {
            flex-direction: column !important;
            gap: 16px;
            padding: 24px 24px !important;
            text-align: center;
          }
          .footer-links {
            flex-direction: column !important;
            gap: 10px !important;
          }
          .footer-links span:nth-of-type(2) {
            display: none !important;
          }
          .landing-main {
            flex-direction: column !important;
            padding: 0 24px 32px !important;
            gap: 40px !important;
            align-items: center !important;
          }
          .dynamic-outlet-container {
            width: 100% !important;
            margin-right: 0px !important;
          }
          .static-features-container {
            width: 100% !important;
            max-width: 440px !important;
          }
        }
      `}</style>
    </div>
  );
}
