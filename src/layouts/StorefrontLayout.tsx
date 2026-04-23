import React, { useState, useMemo, useEffect } from 'react';
import { Outlet, useNavigate, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookStack,
  Sparks,
  Community,
  CalendarCheck,
  Cart,
  Apple, AppleHalf, PizzaSlice, Cookie, HalfCookie, CoffeeCup, Cutlery, Fridge, IceCream, BreadSlice, Egg, Fish, Home
} from 'iconoir-react';
import { SHARED_ICON_OPTIONS as ICON_OPTIONS } from '../utils/icons';
import { CookieBanner } from '../components/CookieBanner';

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

export interface MockupState {
  familyName: string;
  primaryColor: string;
  selectedIconName: string;
  stage: 1 | 2;
}

function DynamicLogoPreview({ primaryColor, IconComp }: { primaryColor: string, IconComp: any }) {
  const [svgStr, setSvgStr] = useState<string>('');
  
  useEffect(() => {
    fetch('/tenet-logo-template.svg')
       .then(res => res.text())
       .then(text => {
          let newText = text.replace(/#143d29/ig, primaryColor);
          // Scale SVG down from original 2000x2000 coordinate space to fit fully inside the preview container
          newText = newText.replace(/width="2000"/i, 'width="100%"').replace(/height="2000"/i, 'height="100%"');
          setSvgStr(newText);
       })
       .catch(e => console.error("Logo fetch error:", e));
  }, [primaryColor]);

  return (
    <div style={{ position: 'relative', width: 140, height: 140 }}>
       {svgStr ? (
         <div dangerouslySetInnerHTML={{ __html: svgStr }} style={{ width: '100%', height: '100%', borderRadius: '28px', overflow: 'hidden', boxShadow: '0 12px 40px rgba(0,0,0,0.06)' }} />
       ) : (
         <div style={{ width: '100%', height: '100%', backgroundColor: 'hsl(var(--bg-frame))', borderRadius: '28px' }} />
       )}
       <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <IconComp width={52} height={52} strokeWidth={2.5} color={primaryColor} />
       </div>
    </div>
  );
}

function PhoneMockup({ mockupState }: { mockupState: MockupState }) {
  const { familyName, primaryColor, selectedIconName, stage } = mockupState;
  const SelectedIconComp = ICON_OPTIONS.find(i => i.name === selectedIconName)?.icon || Home;

  return (
    <div
      className="w-full h-full rounded-[32px] overflow-hidden border-[3px] border-[hsl(var(--bg-frame))] bg-white relative shadow-[0_0_0_7px_rgba(255,255,255,0.65),_0_32px_72px_rgba(0,0,0,0.15)]"
      style={{ isolation: 'isolate' }}
    >
      {/* Notch */}
      <div className="absolute top-[9px] left-1/2 -translate-x-1/2 w-16 h-[9px] bg-[hsl(var(--bg-frame))] rounded-full z-[100]" />
      
      {stage === 1 ? (
        <div className="w-full h-full flex flex-col pt-12">
          <div className="px-5 pb-3 border-b border-gray-100 flex items-center justify-between gap-3 w-full max-w-full overflow-hidden">
            <div 
              style={{ 
                color: primaryColor,
                fontSize: familyName.length > 12 
                  ? `${Math.max(0.65, 1.25 - (familyName.length - 12) * 0.035)}rem` 
                  : '1.25rem',
                lineHeight: 1.1
              }} 
              className="font-bold font-['League_Spartan'] tracking-wide truncate flex-1 min-w-0"
            >
              {familyName || 'Our Family'}
            </div>
            <div className="w-8 h-8 rounded-full bg-gray-100 shrink-0" />
          </div>
          
          <div className="flex-1 bg-[hsl(var(--bg-app))] p-4 flex flex-col gap-4 overflow-hidden">
            {/* High Fidelity Mock Recipe Cards */}
            {[
               { title: 'Smoky Chicken Flautas', time: '35 min' },
               { title: 'Garlic Butter Salmon', time: '20 min' },
               { title: 'Creamy Tuscan Pasta', time: '25 min' }
            ].map((recipe, i) => (
              <div key={i} className="bg-white p-3 rounded-[16px] shadow-sm border border-black/[0.04] flex gap-3">
                <div className="w-16 h-16 bg-[hsl(var(--bg-frame))] rounded-xl shrink-0" />
                <div className="flex flex-col justify-center flex-1">
                  <span className="font-bold text-[hsl(var(--text-primary))] text-[0.85rem] leading-snug mb-1">{recipe.title}</span>
                  <span className="text-[0.65rem] text-[hsl(var(--text-secondary))] font-semibold mb-[6px] uppercase tracking-wide">{recipe.time} • Dinner</span>
                  
                  <div 
                    className="self-start text-[0.7rem] font-bold px-[10px] py-[4px] rounded-md transition-colors"
                    style={{ backgroundColor: `color-mix(in srgb, ${primaryColor} 12%, transparent)`, color: primaryColor }}
                  >
                    + Add Side
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center w-full h-full bg-[hsl(var(--bg-app))] gap-6">
           <DynamicLogoPreview primaryColor={primaryColor} IconComp={SelectedIconComp} />
           <span style={{ color: primaryColor, opacity: 0.8 }} className="font-['League_Spartan'] font-bold tracking-wide text-lg">
              {familyName ? `${familyName.toLowerCase().replace(/[^a-z0-9]/g, '')}` : 'mealhouse'}
           </span>
        </div>
      )}
    </div>
  );
}

const FLOATING_ICONS = [
  Apple, AppleHalf, PizzaSlice, Cookie, HalfCookie, CoffeeCup, Cutlery, Fridge, IceCream, BreadSlice, Egg, Fish
];

export function FloatingBackground() {
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
        size: 120 + Math.random() * 100, // Increased scale
        opacity: 0.05, // Fixed 5% opacity
        duration: 100 + Math.random() * 100,
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
             color: 'hsl(var(--text-secondary))',
             opacity: 0.05,
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
  index,
  isExpanded,
  isMini,
  onClick,
}: {
  feature: Feature;
  index: number;
  isExpanded: boolean;
  isMini: boolean;
  onClick: () => void;
}) {
  return (
    <motion.div
      className="shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-white/60"
      animate={{
        backgroundColor: isExpanded
          ? `hsl(var(--card-${index + 1}))`
          : isMini
            ? `hsl(var(--card-${index + 1}) / 0.5)`
            : `hsl(var(--card-${index + 1}))`,
      }}
      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
      style={{
        borderRadius: 16,
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        overflow: 'hidden',
        cursor: 'pointer',
        flexShrink: 0,
      }}
      whileHover={{
        backgroundColor: `hsl(var(--card-${index + 1}) / 0.8)`,
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
            backgroundColor: feature.id === 'ai' ? 'hsl(var(--accent-h) var(--accent-s) var(--accent-l) / 0.15)' : '#ffffff',
            color: 'hsl(var(--accent-h) var(--accent-s) var(--accent-l))',
            opacity: isMini ? 0.6 : 1,
            boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
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
            color: isMini ? 'hsl(var(--text-secondary))' : 'hsl(var(--text-primary))',
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
            color: isExpanded ? 'hsl(var(--text-primary))' : 'hsl(var(--text-secondary))',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="hsl(var(--text-primary))" strokeWidth="2.2" strokeLinecap="round">
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
            <div style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.5)', margin: '0 18px' }} />
            <p
              style={{
                margin: 0,
                padding: '12px 18px 16px 66px',
                color: 'hsl(var(--text-secondary))',
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
      {FEATURES.map((feature, index) => (
        <FeatureCard
          key={feature.id}
          feature={feature}
          index={index}
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
  const isOnboarding = location.pathname.includes('/onboarding');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);

  const [mockupState, setMockupState] = useState<MockupState>({
    familyName: '',
    primaryColor: 'hsl(150, 40%, 45%)',
    selectedIconName: 'Home',
    stage: 1
  });

  return (
    <div
      className="bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/40 via-[hsl(var(--bg-app))] to-[hsl(var(--bg-frame))] text-[hsl(var(--text-primary))] flex flex-col relative overflow-x-hidden min-h-[100dvh] w-full box-border font-['Inter']"
    >
      <FloatingBackground />

      {/* Header */}
      <header className="landing-header flex items-center justify-between shrink-0 relative z-10 px-6 lg:px-12 py-4">
        <Link to="/" className="flex items-center gap-2.5 md:gap-4 shrink-0 no-underline cursor-pointer group">
          <img src="/meal-planner-logo.svg" alt="MealHouse Logo" className="h-10 w-10 md:h-12 md:w-12 lg:h-14 lg:w-14 group-hover:scale-105 transition-transform duration-200" />
          <span className="font-['League_Spartan'] text-[1.4rem] md:text-[1.8rem] font-extrabold text-[hsl(var(--text-primary))] tracking-wide leading-none">
            mealhouse.app
          </span>
        </Link>

        <motion.button
          id="sign-in-cta"
          onClick={() => navigate('/auth')}
          whileHover={{ scale: 1.04, backgroundColor: 'hsl(var(--bg-frame))' }}
          whileTap={{ scale: 0.97 }}
          transition={{ duration: 0.18 }}
          className="flex items-center justify-center gap-2 px-3 md:px-6 py-2 md:py-2.5 bg-white/40 backdrop-blur-md border-2 border-[hsl(var(--accent-h)_30%_80%)] rounded-full text-[hsl(var(--text-primary))] text-[1.05rem] font-bold font-['League_Spartan'] cursor-pointer tracking-wide"
        >
          <span className="md:hidden flex items-center justify-center">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </span>
          <span className="hidden md:inline">Sign In / Sign Up</span>
        </motion.button>
      </header>

      {/* Main Grid: Left Side changes (Outlet), Right Side static (Features) */}
      <main className="landing-main flex flex-col lg:flex-row items-center w-full flex-1 px-6 lg:px-12 pb-8 lg:pb-6 relative z-10 gap-10 lg:gap-0">
        
        {/* Left Side (Dynamic Content wrapper via Framer Motion) */}
        <div className="dynamic-outlet-container flex-1 grid place-items-center w-full lg:mr-6">
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
              <Outlet context={{ mockupState, setMockupState }} />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Right Side (Static Features) */}
        <div
          className="static-features-container relative flex flex-col lg:block items-center justify-center shrink-0 w-full max-w-[400px] lg:max-w-none gap-8 lg:gap-0 mt-8 lg:mt-0"
          style={{ width: isMobile ? '100%' : (isOnboarding ? 'clamp(280px, 28vw, 360px)' : 'clamp(320px, 45vw, 600px)'), transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)' }}
        >
          <motion.div
             className="relative lg:absolute z-10 flex justify-center w-full"
             animate={{ 
               scale: isMobile ? 1 : (isOnboarding ? 1.1 : 1.05),
               x: isMobile ? 0 : (isOnboarding ? '0%' : '-32%'),
               y: 0
             }}
             transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
             style={{ 
               height: 'min(500px, calc(100dvh - 160px))', 
               aspectRatio: '9 / 17',
             }}
          >
             <PhoneMockup mockupState={mockupState} />
          </motion.div>

          <AnimatePresence>
            {!isOnboarding && (
              <motion.div
                key="features"
                className="relative lg:absolute z-20 w-full lg:w-[56%] lg:right-[-12px]"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 50, transition: { duration: 0.3 } }}
                transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
              >
                <FeatureSection />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Footer */}
      <footer className="landing-footer flex flex-col lg:flex-row items-center justify-between w-full px-6 lg:px-12 py-5 lg:py-4 gap-4 lg:gap-0 shrink-0 relative z-10 border-t border-[hsl(var(--bg-app))] text-[0.85rem] text-[hsl(var(--text-secondary))] text-center lg:text-left">
        <div className="footer-links flex flex-col lg:flex-row items-center gap-2.5 lg:gap-4">
          <span>&copy; {new Date().getFullYear()} MealHouse. All rights reserved.</span>
          <span className="opacity-50 hidden lg:inline">|</span>
          <Link to="/privacy" className="hover:text-[hsl(var(--cta-bg))] transition-colors no-underline">Privacy Policy</Link>
          <Link to="/terms" className="hover:text-[hsl(var(--cta-bg))] transition-colors no-underline">Terms of Service</Link>
        </div>
        <div className="footer-creator mt-1 lg:mt-0">
          Created by:{' '}
          <a href="https://jacksonburch.cloud/mealhouse" target="_blank" rel="noopener noreferrer" className="hover:text-[hsl(var(--cta-bg))] transition-colors no-underline font-semibold">
            Jackson Burch
          </a>
        </div>
      </footer>

      <CookieBanner />
    </div>
  );
}
