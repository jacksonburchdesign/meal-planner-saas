import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';


// ─── CTA Button ───────────────────────────────────────────────────────────────
function CtaButton({ onClick }: { onClick: () => void }) {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.button
      id="build-your-app-cta"
      onClick={onClick}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      animate={{
        backgroundColor: hovered ? 'hsl(var(--cta-hover))' : 'hsl(var(--cta-bg))',
        scale: hovered ? 1.03 : 1,
        boxShadow: hovered
          ? '0 10px 32px rgba(0,0,0,0.15)'
          : '0 6px 24px rgba(0,0,0,0.1)',
      }}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.2 }}
      className="flex items-center gap-2.5 self-start px-9 py-4 rounded-full border-none text-white text-xl font-bold font-['League_Spartan'] cursor-pointer tracking-wide"
    >
      Build My App
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12h14"></path>
        <path d="m12 5 7 7-7 7"></path>
      </svg>
    </motion.button>
  );
}



// ─── Landing Page ──────────────────────────────────────────────────────────────
export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="landing-page-content flex flex-col lg:flex-row items-center justify-between w-full gap-10 lg:gap-6">
      
      {/* ── LEFT: Headline + sub + CTA ── */}
      <div className="flex flex-col justify-center gap-5 flex-1 w-full">
        <h1 className="font-['League_Spartan'] text-[clamp(2.5rem,8vw,4.2rem)] font-black text-[hsl(var(--text-primary))] leading-[1.05] tracking-tight m-0">
          Total Kitchen
          <br />
          Automation.
        </h1>

        <div className="flex flex-col gap-1.5">
          <p className="font-['League_Spartan'] m-0 text-[1.6rem] font-bold text-[hsl(30_15%_35%)] tracking-tight">
            Zero setup.
          </p>
          <p className="font-['League_Spartan'] m-0 text-[1.6rem] font-black text-[hsl(var(--text-primary))] tracking-tight">
            Just $2.99/month.
          </p>
        </div>

        <CtaButton onClick={() => navigate('/onboarding')} />

        {/* Trust badges */}
        <div className="flex flex-col gap-2 mt-1">
          {[
            { icon: '✓', text: 'Your own private app URL' },
            { icon: '✓', text: 'Unlock ALL features for 1 price' },
            { icon: '✓', text: 'Works on any device' },
          ].map(({ icon, text }) => (
            <div key={text} className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[hsl(var(--cta-bg))] flex items-center justify-center text-[0.7rem] font-extrabold text-[hsl(var(--bg-app))] shrink-0 shadow-sm">
                {icon}
              </span>
              <span className="text-[0.92rem] font-semibold text-[hsl(var(--text-secondary))] tracking-tight">
                {text}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
