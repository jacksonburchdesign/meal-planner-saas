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
        backgroundColor: hovered ? '#2d5a8a' : '#1a3a5c',
        scale: hovered ? 1.03 : 1,
        boxShadow: hovered
          ? '0 10px 32px rgba(26,58,92,0.45)'
          : '0 6px 24px rgba(26,58,92,0.30)',
      }}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.2 }}
      style={{
        alignSelf: 'flex-start',
        padding: '16px 38px',
        borderRadius: '100px',
        border: 'none',
        color: '#fff',
        fontSize: '1.25rem',
        fontWeight: 700,
        fontFamily: '"League Spartan", system-ui, sans-serif',
        cursor: 'pointer',
        minHeight: 'unset',
        letterSpacing: '0.02em',
      }}
    >
      Build Your App
    </motion.button>
  );
}



// ─── Landing Page ──────────────────────────────────────────────────────────────
export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div
      className="landing-page-content"
      style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        gap: 24,
      }}
    >
      {/* ── LEFT: Headline + sub + CTA ── */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: 18,
          flex: 1,
        }}
      >
          <h1
            style={{
              fontFamily: '"League Spartan", system-ui, sans-serif',
              fontSize: 'clamp(2.5rem, 8vw, 4.2rem)',
              fontWeight: 900,
              color: '#0f2a4a',
              lineHeight: 1.05,
              letterSpacing: '-0.02em',
              margin: 0,
            }}
          >
            Total Kitchen
            <br />
            Automation.
          </h1>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <p
              style={{
                fontFamily: '"League Spartan", system-ui, sans-serif',
                margin: 0,
                fontSize: '1.6rem',
                fontWeight: 700,
                color: '#1f60a8',
                letterSpacing: '-0.01em',
              }}
            >
              Zero setup.
            </p>
            <p
              style={{
                fontFamily: '"League Spartan", system-ui, sans-serif',
                margin: 0,
                fontSize: '1.6rem',
                fontWeight: 900,
                color: '#0f2a4a',
                letterSpacing: '-0.01em',
              }}
            >
              Just $2.99/month.
            </p>
          </div>

          <CtaButton onClick={() => navigate('/onboarding')} />

          {/* Trust badges */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
            {[
              { icon: '✓', text: 'Your own private app URL' },
              { icon: '✓', text: 'Unlock ALL features for 1 price' },
              { icon: '✓', text: 'Works on any device' },
            ].map(({ icon, text }) => (
              <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    backgroundColor: 'rgba(74,158,237,0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.7rem',
                    fontWeight: 800,
                    color: '#1f60a8',
                    flexShrink: 0,
                  }}
                >
                  {icon}
                </span>
                <span
                  style={{
                    fontSize: '0.92rem',
                    fontWeight: 600,
                    color: '#2a6ba0',
                    letterSpacing: '-0.01em',
                  }}
                >
                  {text}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ── CENTER: Phone + Video ── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            padding: '8px 0',
          }}
        >
          {/*
            Height-driven phone: the phone height is capped, width derives from it.
            This prevents squishing when the viewport is short.
          */}
          <div
            className="landing-phone-wrapper"
            style={{
              height: 'min(480px, calc(100dvh - 160px))',
              aspectRatio: '9 / 17',
              position: 'relative',
              flexShrink: 0,
            }}
          >
            {/* Phone shell */}
            <div
              style={{
                width: '100%',
                height: '100%',
                borderRadius: 32,
                overflow: 'hidden',
                border: '3px solid rgba(74, 158, 237, 0.55)',
                boxShadow:
                  '0 0 0 7px rgba(255,255,255,0.65), 0 32px 72px rgba(15, 42, 74, 0.45)',
                backgroundColor: '#bdd8ef',
                position: 'relative',
              }}
            >
              {/* Notch */}
              <div
                style={{
                  position: 'absolute',
                  top: 9,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: 64,
                  height: 9,
                  backgroundColor: 'rgba(74, 158, 237, 0.5)',
                  borderRadius: 100,
                  zIndex: 10,
                }}
              />
              {/* Video */}
              <video
                autoPlay
                loop
                muted
                playsInline
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  display: 'block',
                  boxSizing: 'border-box',
                  paddingTop: 32,
                  paddingBottom: 8,
                  backgroundColor: '#fff',
                }}
              >
                <source src="/meal-planner-loop.mp4" type="video/mp4" />
                <source src="/meal-planner-loop.mp4" type="video/quicktime" />
              </video>
            </div>
          </div>
        </div>

      <style>{`
        @media (max-width: 900px) {
          .landing-page-content {
            flex-direction: column !important;
            gap: 40px !important;
          }
        }
      `}</style>
    </div>
  );
}
