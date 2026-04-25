import { useState, useEffect } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { generatePngLogoUrl } from '../../tenant_app/utils/logoUtils';
import { createFamilyProfile, createUserRecord } from '../../services/firestore';
import { auth, db } from '../../config/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { motion, AnimatePresence } from 'framer-motion';
import { NavArrowUp, NavArrowDown, Palette, Home, Xmark, CheckCircle } from 'iconoir-react';
import { SHARED_ICON_OPTIONS as ICON_OPTIONS } from '../../utils/icons';

function ChecklistItem({ done, text }: { done: boolean; text: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <span
        style={{
          width: 20,
          height: 20,
          borderRadius: '50%',
          backgroundColor: done ? 'hsl(var(--accent-h) 30% 90%)' : 'hsl(var(--bg-frame))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '0.75rem',
          fontWeight: 800,
          color: done ? 'hsl(var(--text-secondary))' : 'transparent',
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
          color: done ? 'hsl(var(--text-primary))' : 'hsl(var(--text-secondary))',
          letterSpacing: '-0.01em',
          transition: 'color 0.25s',
          opacity: done ? 1 : 0.6,
        }}
      >
        {text}
      </span>
    </div>
  );
}

export default function Onboarding() {
  const [stage, setStage] = useState<1 | 2>(1);
  const [familyName, setFamilyName] = useState('');
  const [adults, setAdults] = useState('');
  const [children, setChildren] = useState('');
  const [primaryColor, setPrimaryColor] = useState('hsl(150, 40%, 45%)');
  
  // Stage 2 state
  const [authorizedEmails, setAuthorizedEmails] = useState<string[]>([]);
  const [emailInput, setEmailInput] = useState('');
  const [selectedIconName, setSelectedIconName] = useState('Home');
  const [logoType, setLogoType] = useState<'icon'|'letters'>('icon');
  const [logoLetters, setLogoLetters] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSlugAvailable, setIsSlugAvailable] = useState<boolean | null>(null);
  const [checkingSlug, setCheckingSlug] = useState(false);

  // Connect to Layout Phone Mockup
  const { setMockupState } = useOutletContext<{ setMockupState: any }>();
  
  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    e.currentTarget.style.setProperty('--x', `${x}px`);
    e.currentTarget.style.setProperty('--y', `${y}px`);
  };
  
  useEffect(() => {
    if (setMockupState) {
      setMockupState({ familyName, primaryColor, selectedIconName, stage, logoType, logoLetters });
    }
  }, [familyName, primaryColor, selectedIconName, stage, logoType, logoLetters, setMockupState]);


  useEffect(() => {
    if (!familyName.trim()) {
      setIsSlugAvailable(null);
      return;
    }
    
    const slug = familyName.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (slug.length < 3) {
      setIsSlugAvailable(null);
      return;
    }

    setCheckingSlug(true);
    const timeoutId = setTimeout(async () => {
      try {
        const docRef = doc(db, 'families', slug);
        const docSnap = await getDoc(docRef);
        setIsSlugAvailable(!docSnap.exists());
      } catch (err) {
        console.error("Error checking slug:", err);
        setIsSlugAvailable(false);
      } finally {
        setCheckingSlug(false);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [familyName]);

  const SelectedIconComp = ICON_OPTIONS.find(i => i.name === selectedIconName)?.icon || Home;

  const handleAddEmail = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const cleanEmail = emailInput.trim().toLowerCase();
      if (cleanEmail && cleanEmail.includes('@') && !authorizedEmails.includes(cleanEmail)) {
        setAuthorizedEmails([...authorizedEmails, cleanEmail]);
        setEmailInput('');
      }
    }
  };

  const handleChangeEmail = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val.includes(',')) {
      const parts = val.split(',');
      const toAdd: string[] = [];
      let remainder = '';

      parts.forEach((p, i) => {
        const cleanPart = p.trim().toLowerCase();
        // If it's the last part and the string didn't end with a comma, keep it in the input box
        if (i === parts.length - 1 && !val.endsWith(',')) {
          remainder = cleanPart;
        } else {
          // It's a completed part (was followed by a comma)
          if (cleanPart && cleanPart.includes('@') && !authorizedEmails.includes(cleanPart) && !toAdd.includes(cleanPart)) {
            toAdd.push(cleanPart);
          }
        }
      });

      if (toAdd.length > 0) {
        setAuthorizedEmails(prev => [...prev, ...toAdd]);
      }
      setEmailInput(remainder);
    } else {
      setEmailInput(val);
    }
  };

  const removeEmail = (email: string) => {
    setAuthorizedEmails(authorizedEmails.filter(e => e !== email));
  };

  const handleStage1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (familyName && adults && children && primaryColor && isSlugAvailable) {
      setStage(2);
    }
  };

  const handleStripeCheckout = async () => {
    if (!familyName) return;
    setLoading(true);

    try {
      const slug = familyName.toLowerCase().replace(/[^a-z0-9]/g, '');
      const familyId = slug;

      // 1. Sign in with Google at the point of submission
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // 2. Upload combined App Logo to Firebase Storage
      let iconUrl = '';
      try {
        const iconNode = logoType === 'letters' ? (
          <svg width="100%" height="100%" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <text x="50%" y="54%" dominantBaseline="middle" textAnchor="middle" fill={primaryColor} fontSize="48px" fontWeight="800" fontFamily="League Spartan, system-ui, sans-serif" letterSpacing="-0.02em">{logoLetters}</text>
          </svg>
        ) : (
          <SelectedIconComp width="100%" height="100%" fill={primaryColor} />
        );
        iconUrl = await generatePngLogoUrl(familyId, iconNode, primaryColor);
      } catch (err) {
        console.warn("Failed to generate custom icon png, falling back.", err);
      }

      let finalEmails = [...authorizedEmails];
      const cleanInput = emailInput.trim().toLowerCase();
      if (cleanInput.includes('@') && !finalEmails.includes(cleanInput)) {
        finalEmails.push(cleanInput);
      }

      // 3. Create the family profile (unpaid status for Stripe verification)
      await createFamilyProfile(familyId, {
        subdomain_slug: slug,
        name: familyName,
        status: 'unpaid',
        authorizedEmails: finalEmails,
        demographics: {
          adults: parseInt(adults || '1', 10),
          children: parseInt(children || '0', 10),
        },
        theme: {
          primaryColor: primaryColor || '#3b82f6',
          secondaryColor: '#10b981',
          iconUrl,
          iconName: selectedIconName
        },
      });

      // 4. Link the user to this family
      await createUserRecord(user.uid, {
        email: user.email || '',
        subscriptionTier: 'free',
        familyId: familyId,
      });

      // 5. Initialize Stripe Checkout
      const STRIPE_PRICE_ID = 'price_1TNO4VJHX18tokZby4LeKs11';
      const BASE_URL = import.meta.env.VITE_STRIPE_API_URL || 'https://api-yr7sfhb5va-uc.a.run.app';
      const functionUrl = `${BASE_URL}/create-checkout-session`;

      // Dynamically calculate return URLs based on execution environment (local loopback vs production)
      const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const protocol = window.location.protocol;
      const portSplit = window.location.port ? `:${window.location.port}` : '';
      const targetHost = isLocal ? `${slug}.localhost${portSplit}` : `${slug}.mealhouse.app`;
      
      const successUrl = `${protocol}//${targetHost}/success?session_id={CHECKOUT_SESSION_ID}`;
      const cancelUrl = `${protocol}//${targetHost}/canceled`;
      
      const checkoutRes = await fetch(functionUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          priceId: STRIPE_PRICE_ID, 
          familyId, 
          email: user.email,
          successUrl,
          cancelUrl
        })
      });

      if (checkoutRes.ok) {
        const { url } = await checkoutRes.json();
        // Redirect completely out to the Stripe-hosted checkout page
        window.location.href = url;
      } else {
        const errorText = await checkoutRes.text();
        console.error("Stripe session failed:", errorText);
        alert(`Failed to initialize Stripe checkout: ${errorText}`);
      }

    } catch (err: unknown) {
      console.error('Failed to generate app', err);
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
    border: '1px solid hsl(var(--accent-h) 30% 80%)',
    backgroundColor: '#ffffff',
    boxShadow: '0 8px 30px rgba(0,0,0,0.02)',
    fontSize: '1.15rem',
    color: 'hsl(var(--text-primary))',
    fontWeight: 600,
    outline: 'none',
    fontFamily: '"League Spartan", system-ui, sans-serif',
    boxSizing: 'border-box' as const,
    transition: 'all 0.2s',
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.boxShadow = `0 12px 40px rgba(0,0,0,0.04), 0 0 0 3px color-mix(in srgb, ${primaryColor} 40%, transparent)`;
    e.target.style.borderColor = primaryColor;
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.boxShadow = '0 8px 30px rgba(0,0,0,0.02)';
    e.target.style.borderColor = 'hsl(var(--accent-h) 30% 80%)';
  };

  return (
    <div className="onboarding-page-content flex flex-col lg:flex-row items-center justify-between w-full gap-8 lg:gap-6">
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
            color: 'hsl(var(--text-primary))',
            lineHeight: 1.05,
            letterSpacing: '-0.02em',
            margin: 0,
          }}
        >
          {stage === 1 ? (
            <>
              Build Your<br />App.
            </>
          ) : (
            <>
              Make it<br />Yours.
            </>
          )}
        </h1>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <p
            style={{
              fontFamily: '"League Spartan", system-ui, sans-serif',
              margin: '0 0 8px 0',
              fontSize: '1.6rem',
              fontWeight: 700,
              color: 'hsl(var(--text-secondary))',
              letterSpacing: '-0.01em',
            }}
          >
            {stage === 1 ? "Set up your family's planner." : "Customize access and branding."}
          </p>
        </div>

        {/* Dynamic Checklist */}
        <AnimatePresence mode="popLayout">
          {stage === 1 ? (
            <motion.div 
              key="stage1_checklist"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20, filter: 'blur(8px)' }}
              style={{ display: 'flex', flexDirection: 'column', gap: 10, margin: '4px 0 24px 0' }}
            >
              <ChecklistItem done={!!familyName} text="Name your family" />
              <ChecklistItem done={!!adults && !!children} text="Set family demographics" />
              <ChecklistItem done={!!primaryColor && primaryColor !== '#3b82f6'} text="Choose theme color" />
            </motion.div>
          ) : (
            <motion.div 
              key="stage2_checklist"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20, filter: 'blur(8px)' }}
              style={{ display: 'flex', flexDirection: 'column', gap: 10, margin: '4px 0 24px 0' }}
            >
              <ChecklistItem done={true} text="App infrastructure built" />
              <ChecklistItem done={authorizedEmails.length > 0 || (emailInput.includes('@') && emailInput.length > 4)} text="Set authorized members" />
              <ChecklistItem done={selectedIconName !== 'Home'} text="Design app logo" />
              <ChecklistItem done={false} text="Activate subscription" />
            </motion.div>
          )}
        </AnimatePresence>

        {stage === 1 && (
          <p style={{ margin: 0, fontSize: '0.9rem', color: 'hsl(var(--text-secondary))', fontWeight: 600, paddingLeft: 6 }}>
            You will configure access & billing next.
          </p>
        )}
      </div>

      {/* ── CENTER / RIGHT: Form Inputs ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          padding: '8px 0',
          position: 'relative'
        }}
      >
        <AnimatePresence mode="wait">
          {stage === 1 ? (
            <motion.form
              key="stage1f"
              onSubmit={handleStage1Submit}
              initial={{ opacity: 0, filter: 'blur(8px)', scale: 0.95 }}
              animate={{ opacity: 1, filter: 'blur(0px)', scale: 1 }}
              exit={{ opacity: 0, filter: 'blur(8px)', scale: 0.95 }}
              transition={{ duration: 0.4 }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '22px',
                width: 'clamp(320px, 28vw, 440px)',
                flexShrink: 0,
              }}
            >
              <div>
                <label style={{ display: 'block', fontSize: '1.05rem', fontWeight: 700, color: 'hsl(var(--text-secondary))', marginBottom: '8px', paddingLeft: '4px', fontFamily: '"League Spartan", system-ui, sans-serif', letterSpacing: '-0.01em' }}>
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
                <p 
                  style={{ 
                    margin: '8px 0 0 6px', 
                    fontSize: '0.85rem', 
                    color: 'hsl(var(--text-secondary))', 
                    fontWeight: 600, 
                    fontFamily: '"Inter", system-ui, sans-serif', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 6,
                    minHeight: '20px',
                    opacity: familyName ? 1 : 0,
                    pointerEvents: familyName ? 'auto' : 'none',
                    transition: 'opacity 0.2s',
                    overflow: 'hidden'
                  }}
                >
                  <span className="shrink-0">Your URL:</span>
                  <span 
                    style={{ color: 'hsl(var(--text-primary))', fontWeight: 800 }} 
                    className="truncate min-w-0"
                  >
                    {(familyName || 'family').toLowerCase().replace(/[^a-z0-9]/g, '')}.mealhouse.app
                  </span>
                  <span className="shrink-0 flex items-center">
                    {checkingSlug && <span className="text-zinc-400">...</span>}
                    {!checkingSlug && isSlugAvailable === true && <CheckCircle width={16} height={16} color="#10b981" strokeWidth={2.5} />}
                    {!checkingSlug && isSlugAvailable === false && <Xmark width={16} height={16} color="#f43f5e" strokeWidth={2.5} />}
                  </span>
                </p>
              </div>

              <div style={{ display: 'flex', gap: '20px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '1.05rem', fontWeight: 700, color: 'hsl(var(--text-secondary))', marginBottom: '8px', paddingLeft: '4px', fontFamily: '"League Spartan", system-ui, sans-serif', letterSpacing: '-0.01em' }}>
                    Adults
                  </label>
                  <div style={{ position: 'relative', width: '100%' }}>
                    <input
                      type="number"
                      required
                      min="1"
                      value={adults}
                      onChange={(e) => setAdults(e.target.value)}
                      style={{ ...glassInputStyle, paddingRight: '48px' }}
                      onFocus={handleFocus}
                      onBlur={handleBlur}
                    />
                    <div style={{ position: 'absolute', right: 8, top: 4, bottom: 4, display: 'flex', flexDirection: 'column', gap: 2, justifyContent: 'center' }}>
                      <div onClick={() => setAdults(String((Number(adults) || 0) + 1))} style={{ padding: '0 8px', color: 'hsl(var(--text-secondary))', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                        <NavArrowUp width={16} height={16} strokeWidth={2.5} />
                      </div>
                      <div onClick={() => setAdults(String(Math.max(1, (Number(adults) || 2) - 1)))} style={{ padding: '0 8px', color: 'hsl(var(--text-secondary))', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                        <NavArrowDown width={16} height={16} strokeWidth={2.5} />
                      </div>
                    </div>
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '1.05rem', fontWeight: 700, color: 'hsl(var(--text-secondary))', marginBottom: '8px', paddingLeft: '4px', fontFamily: '"League Spartan", system-ui, sans-serif', letterSpacing: '-0.01em' }}>
                    Children
                  </label>
                  <div style={{ position: 'relative', width: '100%' }}>
                    <input
                      type="number"
                      required
                      min="0"
                      value={children}
                      onChange={(e) => setChildren(e.target.value)}
                      style={{ ...glassInputStyle, paddingRight: '48px' }}
                      onFocus={handleFocus}
                      onBlur={handleBlur}
                    />
                    <div style={{ position: 'absolute', right: 8, top: 4, bottom: 4, display: 'flex', flexDirection: 'column', gap: 2, justifyContent: 'center' }}>
                      <div onClick={() => setChildren(String((Number(children) || 0) + 1))} style={{ padding: '0 8px', color: 'hsl(var(--text-secondary))', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                        <NavArrowUp width={16} height={16} strokeWidth={2.5} />
                      </div>
                      <div onClick={() => setChildren(String(Math.max(0, (Number(children) || 1) - 1)))} style={{ padding: '0 8px', color: 'hsl(var(--text-secondary))', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                        <NavArrowDown width={16} height={16} strokeWidth={2.5} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '1.05rem', fontWeight: 700, color: 'hsl(var(--text-secondary))', marginBottom: '8px', paddingLeft: '4px', fontFamily: '"League Spartan", system-ui, sans-serif', letterSpacing: '-0.01em' }}>
                  App Accent Color
                </label>
                <div style={{ ...glassInputStyle, padding: '12px 18px', display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer', position: 'relative' }}>
                  <input
                    id="primary-color-input"
                    type="color"
                    required
                    value={primaryColor.startsWith('hsl') ? '#45a065' : primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    style={{ opacity: 0, position: 'absolute', inset: 0, width: '100%', height: '100%', cursor: 'pointer', zIndex: 10 }}
                  />
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: primaryColor, boxShadow: '0 8px 30px rgba(0,0,0,0.04), 0 0 0 2px rgba(255,255,255,0.8)', position: 'relative', zIndex: 5 }} />
                  <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'hsl(var(--text-primary))', display: 'flex', alignItems: 'center', gap: 8, position: 'relative', zIndex: 5 }}>
                    <Palette width={22} height={22} color="hsl(var(--text-secondary))" strokeWidth={2.5} />
                    Theme Accent Color
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
                <button
                  type="submit"
                  disabled={!familyName || !adults || !children || !primaryColor || !isSlugAvailable || checkingSlug}
                  onMouseMove={handleMouseMove}
                  className="glow-button"
                  style={{
                    padding: '16px 38px',
                    borderRadius: '100px',
                    border: 'none',
                    backgroundColor: (!familyName || !adults || !children || !primaryColor || !isSlugAvailable || checkingSlug) ? 'hsl(var(--cta-bg) / 0.5)' : 'hsl(var(--cta-bg))',
                    color: '#fff',
                    fontSize: '1.15rem',
                    fontWeight: 700,
                    fontFamily: '"League Spartan", system-ui, sans-serif',
                    cursor: (!familyName || !adults || !children || !primaryColor || !isSlugAvailable || checkingSlug) ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: (!familyName || !adults || !children || !primaryColor || !isSlugAvailable || checkingSlug) ? 'none' : '0 8px 24px rgba(0,0,0,0.15)',
                  }}
                >
                  <span>Continue →</span>
                </button>
              </div>
            </motion.form>
          ) : (
            <motion.div
              key="stage2f"
              initial={{ opacity: 0, filter: 'blur(8px)', scale: 0.95 }}
              animate={{ opacity: 1, filter: 'blur(0px)', scale: 1 }}
              exit={{ opacity: 0, filter: 'blur(8px)', scale: 0.95 }}
              transition={{ duration: 0.4 }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                width: '100%',
                maxWidth: '440px',
                flexShrink: 0,
              }}
            >
              {/* Authorized Emails */}
              <div>
                <label className="flex items-center gap-1.5" style={{ fontSize: '1.05rem', fontWeight: 700, color: 'hsl(var(--text-primary))', marginBottom: '4px', paddingLeft: '4px', fontFamily: '"League Spartan", system-ui, sans-serif', letterSpacing: '-0.01em' }}>
                  Authorized Member Emails
                  <button type="button" tabIndex={0} className="relative group flex items-center justify-center translate-y-[-1.5px] outline-none border-none bg-transparent p-0 m-0">
                     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400 cursor-help group-hover:text-[hsl(var(--primary))] group-focus:text-[hsl(var(--primary))] transition-colors">
                        <circle cx="12" cy="12" r="10"></circle>
                        <path d="M12 16v-4"></path>
                        <path d="M12 8h.01"></path>
                     </svg>
                     <div className="pointer-events-none absolute bottom-[calc(100%+8px)] left-1/2 -translate-x-1/2 w-48 opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-all bg-zinc-800 text-white text-[12px] font-medium p-3 rounded-xl shadow-xl z-50 text-center leading-snug font-['Inter'] tracking-normal">
                        Only these email addresses will be permitted to access your family's app vault.
                        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-[1px] border-[6px] border-transparent border-t-zinc-800" />
                     </div>
                  </button>
                </label>
                <div style={{ ...glassInputStyle, padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 8, cursor: 'text' }} onClick={() => document.getElementById('email-input')?.focus()}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {authorizedEmails.map(email => (
                      <div key={email} style={{ display: 'flex', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.7)', padding: '4px 10px', borderRadius: 100, fontSize: '0.85rem', fontWeight: 600, color: 'hsl(var(--text-primary))' }}>
                        {email}
                        <Xmark width={14} height={14} strokeWidth={3} style={{ cursor: 'pointer', color: 'hsl(var(--text-secondary))' }} onClick={(e) => { e.stopPropagation(); removeEmail(email); }} />
                      </div>
                    ))}
                    <input
                      id="email-input"
                      type="email"
                      value={emailInput}
                      onChange={handleChangeEmail}
                      onKeyDown={handleAddEmail}
                      placeholder={authorizedEmails.length === 0 ? "Enter emails separated by commas" : "Add another..."}
                      style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '1.05rem', flex: 1, minWidth: 120, color: '#0f2a4a', fontWeight: 600, fontFamily: '"Inter", system-ui, sans-serif' }}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '1.05rem', fontWeight: 700, color: 'hsl(var(--text-secondary))', marginBottom: '4px', paddingLeft: '4px', fontFamily: '"League Spartan", system-ui, sans-serif', letterSpacing: '-0.01em' }}>
                  Design App Icon
                </label>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '4px' }}>
                  <button
                    type="button"
                    onClick={() => setLogoType('icon')}
                    style={{ flex: 1, padding: '6px', borderRadius: '10px', fontSize: '0.95rem', fontWeight: 700, cursor: 'pointer', border: '1px solid', borderColor: logoType === 'icon' ? primaryColor : 'rgba(0,0,0,0.05)', backgroundColor: logoType === 'icon' ? `${primaryColor}20` : 'white', color: logoType === 'icon' ? primaryColor : 'hsl(var(--text-secondary))', transition: 'all 0.2s' }}
                  >
                    Icon
                  </button>
                  <button
                    type="button"
                    onClick={() => setLogoType('letters')}
                    style={{ flex: 1, padding: '6px', borderRadius: '10px', fontSize: '0.95rem', fontWeight: 700, cursor: 'pointer', border: '1px solid', borderColor: logoType === 'letters' ? primaryColor : 'rgba(0,0,0,0.05)', backgroundColor: logoType === 'letters' ? `${primaryColor}20` : 'white', color: logoType === 'letters' ? primaryColor : 'hsl(var(--text-secondary))', transition: 'all 0.2s' }}
                  >
                    Letters
                  </button>
                </div>
                
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 16,
                  padding: '10px',
                  borderRadius: '16px',
                  border: 'none',
                  backgroundColor: 'white',
                  boxShadow: '0 8px 30px rgba(0,0,0,0.04), 0 0 0 1px rgba(255,255,255,0.6)',
                }}>
                  {logoType === 'icon' ? (
                    <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, maxHeight: 150, overflowY: 'auto', paddingRight: 4 }}>
                      {ICON_OPTIONS.map((opt) => (
                        <button 
                          key={opt.name}
                          type="button"
                          aria-label={`Select ${opt.name} icon`}
                          onClick={() => setSelectedIconName(opt.name)}
                          style={{
                            aspectRatio: '1',
                            borderRadius: 8,
                            border: 'none',
                            backgroundColor: selectedIconName === opt.name ? primaryColor : 'rgba(255,255,255,0.4)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            color: selectedIconName === opt.name ? '#ffffff' : 'hsl(var(--text-primary))',
                            transition: 'all 0.15s'
                          }}
                        >
                          <opt.icon width={28} height={28} />
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                      <input
                        type="text"
                        maxLength={2}
                        placeholder="Ex: MH"
                        value={logoLetters}
                        onChange={(e) => setLogoLetters(e.target.value.toUpperCase())}
                        style={{ ...glassInputStyle, width: '100px', textAlign: 'center', fontSize: '1.4rem', fontWeight: 800, padding: '12px' }}
                      />
                      <span style={{ fontSize: '0.8rem', color: 'hsl(var(--text-secondary))', marginTop: '8px' }}>Up to 2 letters</span>
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 6 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: '0.85rem', color: 'hsl(var(--text-secondary))', padding: '0 4px' }}>
                  <input 
                    type="checkbox" 
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    style={{ cursor: 'pointer', accentColor: 'hsl(var(--cta-bg))', width: 16, height: 16 }}
                  />
                  <span>
                    I accept the <Link to="/terms" style={{ color: 'hsl(var(--cta-bg))', textDecoration: 'underline', fontWeight: 600 }} target="_blank">Terms and Conditions</Link>
                  </span>
                </label>

                <button
                  type="button"
                  onClick={handleStripeCheckout}
                  disabled={loading || !acceptedTerms}
                  className="glow-button"
                  onMouseMove={(e) => {
                    handleMouseMove(e);
                  }}
                  onMouseEnter={(e) => {
                    if (!loading && acceptedTerms) (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'hsl(var(--cta-hover))';
                  }}
                  onMouseLeave={(e) => {
                    if (!loading && acceptedTerms) (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'hsl(var(--cta-bg))';
                  }}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '100px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    backgroundColor: (loading || !acceptedTerms) ? 'hsl(var(--cta-bg) / 0.6)' : 'hsl(var(--cta-bg))',
                    color: '#fff',
                    fontSize: '1.2rem',
                    fontWeight: 700,
                    fontFamily: '"Inter", system-ui, sans-serif',
                    cursor: (loading || !acceptedTerms) ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: (loading || !acceptedTerms) ? 'none' : '0 12px 32px hsl(var(--cta-bg) / 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 10
                  }}
                >
                  {loading ? (
                    <span>Securing Subscription...</span>
                  ) : (
                    <span>
                      Pay with Stripe & Launch
                    </span>
                  )}
                </button>
                
                <p style={{ textAlign: 'center', fontSize: '0.85rem', color: 'hsl(var(--text-secondary))', fontWeight: 600, marginTop: '2px', marginBottom: '4px' }}>
                  Includes a <span style={{ color: 'hsl(var(--text-primary))', fontWeight: 800 }}>30-day free trial</span>. Cancel anytime.
                </p>

                <button
                  type="button"
                  onClick={() => setStage(1)}
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '100px',
                    border: 'none',
                    backgroundColor: 'transparent',
                    color: 'hsl(var(--text-secondary))',
                    fontSize: '1.05rem',
                    fontWeight: 700,
                    fontFamily: '"Inter", system-ui, sans-serif',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    if (!loading) (e.currentTarget as HTMLButtonElement).style.color = 'hsl(var(--text-primary))';
                  }}
                  onMouseLeave={(e) => {
                    if (!loading) (e.currentTarget as HTMLButtonElement).style.color = 'hsl(var(--text-secondary))';
                  }}
                >
                  ← Back to Customization
                </button>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 16 }}>
                  <span style={{ fontSize: '0.85rem', color: 'hsl(var(--text-secondary))', fontWeight: 600 }}>Secured by Stripe</span>
                  <span style={{ fontSize: '0.85rem', color: 'hsl(var(--text-secondary))', fontWeight: 600 }}>Google Auth required</span>
                </div>
              </div>

            </motion.div>
          )}
        </AnimatePresence>
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
    </div>
  );
}
