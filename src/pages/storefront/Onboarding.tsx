import { useState } from 'react';
import { createFamilyProfile, createUserRecord } from '../../services/firestore';
import { auth } from '../../config/firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { NavArrowUp, NavArrowDown, Palette } from 'iconoir-react';

function ChecklistItem({ done, text }: { done: boolean; text: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <span
        style={{
          width: 20,
          height: 20,
          borderRadius: '50%',
          backgroundColor: done ? 'rgba(74,158,237,0.25)' : 'rgba(74,158,237,0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '0.75rem',
          fontWeight: 800,
          color: done ? '#1f60a8' : 'transparent',
          flexShrink: 0,
          transition: 'all 0.25s',
        }}
      >
        ✓
      </span>
      <span
        style={{
          fontSize: '0.95rem',
          fontWeight: 600,
          color: done ? '#2a6ba0' : '#8ab8d8',
          letterSpacing: '-0.01em',
          transition: 'color 0.25s',
        }}
      >
        {text}
      </span>
    </div>
  );
}

export default function Onboarding() {
  const [familyName, setFamilyName] = useState('');
  const [adults, setAdults] = useState('');
  const [children, setChildren] = useState('');
  const [primaryColor, setPrimaryColor] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGenerateApp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!familyName) return;
    setLoading(true);

    try {
      // 1. Sign in with Google at the point of submission
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // 2. Create the family profile
      const slug = familyName.toLowerCase().replace(/[^a-z0-9]/g, '');
      const familyId = `fam_${slug}_${Math.floor(Math.random() * 1000)}`;

      await createFamilyProfile(familyId, {
        subdomain_slug: slug,
        name: familyName,
        demographics: {
          adults: parseInt(adults || '1', 10),
          children: parseInt(children || '0', 10),
        },
        theme: {
          primaryColor: primaryColor || '#3b82f6',
          secondaryColor: '#10b981',
        },
      });

      // 3. Link the user to this family
      await createUserRecord(user.uid, {
        email: user.email || '',
        subscriptionTier: 'free',
        familyId: familyId,
      });

      // 4. Route to the new subdomain
      const domain = 'mealhouse.app';
      const isLocalhost = window.location.hostname.includes('localhost');
      const isVercel = window.location.hostname.includes('vercel.app');

      if (isLocalhost) {
        const port = window.location.port ? `:${window.location.port}` : '';
        window.location.href = `http://${slug}.localhost${port}`;
      } else if (isVercel) {
        localStorage.setItem('previewTenant', slug);
        window.location.href = '/';
      } else {
        window.location.href = `https://${slug}.${domain}`;
      }
    } catch (err: unknown) {
      console.error('Failed to generate app', err);
      // Don't alert on Google sign-in cancellation
      if ((err as { code?: string })?.code !== 'auth/cancelled-popup-request' &&
          (err as { code?: string })?.code !== 'auth/popup-closed-by-user') {
        alert('Failed to generate app. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const glassInputStyle = {
    width: '100%',
    padding: '16px 20px',
    borderRadius: '16px',
    border: '1px solid rgba(255,255,255,0.4)',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    boxShadow: '0 4px 16px rgba(30, 80, 160, 0.08), inset 0 1px 0 rgba(255,255,255,0.4)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    fontSize: '1.15rem',
    color: '#0f2a4a',
    fontWeight: 600,
    outline: 'none',
    fontFamily: '"League Spartan", system-ui, sans-serif',
    boxSizing: 'border-box' as const,
    transition: 'all 0.2s',
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.4)';
    e.target.style.borderColor = 'rgba(255, 255, 255, 0.8)';
    e.target.style.boxShadow = '0 8px 32px rgba(30, 80, 160, 0.14), inset 0 1px 0 rgba(255,255,255,0.6)';
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
    e.target.style.borderColor = 'rgba(255, 255, 255, 0.4)';
    e.target.style.boxShadow = '0 4px 16px rgba(30, 80, 160, 0.08), inset 0 1px 0 rgba(255,255,255,0.4)';
  };

  return (
    <form
      className="onboarding-page-content"
      onSubmit={handleGenerateApp}
      style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        gap: 24,
      }}
    >
      {/* ── LEFT: Headline + Checklist + CTA ── */}
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
          Build Your
          <br />
          App.
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
            Set up your family's meal planner.
          </p>
        </div>

        {/* Dynamic Checklist */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, margin: '8px 0 2px 0' }}>
          <ChecklistItem done={!!familyName} text="Name your family" />
          <ChecklistItem done={!!adults && !!children} text="Set family demographics" />
          <ChecklistItem done={!!primaryColor} text="Choose theme color" />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
          <button
            type="submit"
            disabled={loading || !familyName || !adults || !children || !primaryColor}
            style={{
              alignSelf: 'flex-start',
              padding: '16px 38px',
              borderRadius: '100px',
              border: 'none',
              backgroundColor: loading || !familyName || !adults || !children || !primaryColor ? '#8ab8d8' : '#1a3a5c',
              color: '#fff',
              fontSize: '1.25rem',
              fontWeight: 700,
              fontFamily: '"League Spartan", system-ui, sans-serif',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.2s, box-shadow 0.2s',
              boxShadow: loading ? 'none' : '0 10px 32px rgba(26,58,92,0.45)',
              letterSpacing: '0.02em',
            }}
          >
            {loading ? 'Creating your app…' : 'Generate App →'}
          </button>
          <p style={{ margin: 0, fontSize: '0.9rem', color: '#1f60a8', fontWeight: 600, paddingLeft: 12 }}>
            You'll authenticate with Google when you proceed.
          </p>
        </div>
      </div>

      {/* ── CENTER / RIGHT: Form Inputs ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          padding: '8px 0',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '22px',
            width: 'clamp(320px, 28vw, 440px)',
            flexShrink: 0,
          }}
        >
          {/* Family Name */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '1.05rem',
                fontWeight: 700,
                color: '#1f60a8',
                marginBottom: '8px',
                paddingLeft: '4px',
                fontFamily: '"League Spartan", system-ui, sans-serif',
                letterSpacing: '-0.01em',
              }}
            >
              Family Name
            </label>
            <input
              type="text"
              required
              value={familyName}
              onChange={(e) => setFamilyName(e.target.value)}
              placeholder="e.g., The Smiths"
              style={glassInputStyle}
              onFocus={handleFocus}
              onBlur={handleBlur}
            />
            {familyName && (
              <p style={{ margin: '8px 0 0 6px', fontSize: '0.85rem', color: '#1f60a8', fontWeight: 600, fontFamily: '"Inter", system-ui, sans-serif' }}>
                Your URL: <span style={{ color: '#0f2a4a', fontWeight: 800 }}>{familyName.toLowerCase().replace(/[^a-z0-9]/g, '')}.mealhouse.app</span>
              </p>
            )}
          </div>

          {/* Adults + Children */}
          <div style={{ display: 'flex', gap: '20px' }}>
            <div style={{ flex: 1 }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '1.05rem',
                  fontWeight: 700,
                  color: '#1f60a8',
                  marginBottom: '8px',
                  paddingLeft: '4px',
                  fontFamily: '"League Spartan", system-ui, sans-serif',
                  letterSpacing: '-0.01em',
                }}
              >
                Adults
              </label>
            <div style={{ position: 'relative', width: '100%' }}>
              <input
                type="number"
                min="1"
                value={adults}
                onChange={(e) => setAdults(e.target.value)}
                style={{ ...glassInputStyle, paddingRight: '48px' }}
                onFocus={handleFocus}
                onBlur={handleBlur}
              />
              <div style={{ position: 'absolute', right: 8, top: 4, bottom: 4, display: 'flex', flexDirection: 'column', gap: 2, justifyContent: 'center' }}>
                <div 
                  onClick={() => setAdults(String((Number(adults) || 0) + 1))}
                  style={{ padding: '0 8px', color: '#1f60a8', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                >
                  <NavArrowUp width={16} height={16} strokeWidth={2.5} />
                </div>
                <div 
                  onClick={() => setAdults(String(Math.max(1, (Number(adults) || 2) - 1)))}
                  style={{ padding: '0 8px', color: '#1f60a8', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                >
                  <NavArrowDown width={16} height={16} strokeWidth={2.5} />
                </div>
              </div>
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <label
              style={{
                display: 'block',
                fontSize: '1.05rem',
                fontWeight: 700,
                color: '#1f60a8',
                marginBottom: '8px',
                paddingLeft: '4px',
                fontFamily: '"League Spartan", system-ui, sans-serif',
                letterSpacing: '-0.01em',
              }}
            >
              Children
            </label>
            <div style={{ position: 'relative', width: '100%' }}>
              <input
                type="number"
                min="0"
                value={children}
                onChange={(e) => setChildren(e.target.value)}
                style={{ ...glassInputStyle, paddingRight: '48px' }}
                onFocus={handleFocus}
                onBlur={handleBlur}
              />
              <div style={{ position: 'absolute', right: 8, top: 4, bottom: 4, display: 'flex', flexDirection: 'column', gap: 2, justifyContent: 'center' }}>
                <div 
                  onClick={() => setChildren(String((Number(children) || 0) + 1))}
                  style={{ padding: '0 8px', color: '#1f60a8', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                >
                  <NavArrowUp width={16} height={16} strokeWidth={2.5} />
                </div>
                <div 
                  onClick={() => setChildren(String(Math.max(0, (Number(children) || 1) - 1)))}
                  style={{ padding: '0 8px', color: '#1f60a8', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                >
                  <NavArrowDown width={16} height={16} strokeWidth={2.5} />
                </div>
              </div>
            </div>
          </div>
          </div>

          {/* Primary Color */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '1.05rem',
                fontWeight: 700,
                color: '#1f60a8',
                marginBottom: '8px',
                paddingLeft: '4px',
                fontFamily: '"League Spartan", system-ui, sans-serif',
                letterSpacing: '-0.01em',
              }}
            >
              App Accent Color
            </label>
            <div
              onClick={() => document.getElementById('primary-color-input')?.click()}
              style={{
                ...glassInputStyle,
                padding: '12px 18px',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                cursor: 'pointer',
              }}
            >
              <input
                id="primary-color-input"
                type="color"
                value={primaryColor || '#ffffff'}
                onChange={(e) => setPrimaryColor(e.target.value)}
                style={{
                  opacity: 0,
                  position: 'absolute',
                  pointerEvents: 'none',
                }}
              />
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  backgroundColor: primaryColor || 'transparent',
                  border: '2px solid rgba(255,255,255,0.8)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.4)',
                }}
              />
              <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f2a4a', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Palette width={22} height={22} color="#1f60a8" strokeWidth={2.5} />
                Theme Accent Color
              </span>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .onboarding-page-content input[type="number"]::-webkit-inner-spin-button,
        .onboarding-page-content input[type="number"]::-webkit-outer-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        .onboarding-page-content input[type="number"] {
          -moz-appearance: textfield;
        }

        @media (max-width: 900px) {
          .onboarding-page-content {
            flex-direction: column !important;
            gap: 40px !important;
          }
        }
      `}</style>
    </form>
  );
}
