import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../../config/firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { getUserRecord } from '../../services/firestore';

export default function AuthPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Look up the user's family record
      const record = await getUserRecord(user.uid);

      if (record?.familyId) {
        // Returning user — route to their subdomain
        const isLocalhost = window.location.hostname.includes('localhost');
        const isVercel = window.location.hostname.includes('vercel.app');

        if (isLocalhost) {
          const slug = record.familyId.replace(/^fam_/, '').replace(/_\d+$/, '');
          const port = window.location.port ? `:${window.location.port}` : '';
          window.location.href = `http://${slug}.localhost${port}`;
        } else if (isVercel) {
          const slug = record.familyId.replace(/^fam_/, '').replace(/_\d+$/, '');
          localStorage.setItem('previewTenant', slug);
          window.location.href = '/';
        } else {
          const slug = record.familyId.replace(/^fam_/, '').replace(/_\d+$/, '');
          window.location.href = `https://${slug}.mealhouse.app`;
        }
      } else {
        // New user — no family yet, send to onboarding
        navigate('/onboarding');
      }
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      if (code !== 'auth/cancelled-popup-request' && code !== 'auth/popup-closed-by-user') {
        setError('Sign in failed. Please try again.');
        console.error('Auth error:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        height: '100dvh',
        width: '100%',
        backgroundColor: '#d6eaf8',
        backgroundImage: 'radial-gradient(ellipse at 25% 15%, #bdddf5 0%, #d6eaf8 45%, #c5dcf0 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: '"Inter", ui-sans-serif, system-ui, sans-serif',
        overflow: 'hidden',
      }}
    >
      {/* Back link */}
      <button
        onClick={() => navigate('/')}
        style={{
          position: 'absolute',
          top: 20,
          left: 32,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: '#2d6fa8',
          fontWeight: 600,
          fontSize: '0.9rem',
          fontFamily: 'inherit',
          padding: '8px 12px',
          borderRadius: 8,
          minHeight: 'unset',
          transition: 'background-color 0.2s',
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(74,158,237,0.12)'; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'; }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Back
      </button>

      {/* Card */}
      <div
        style={{
          width: '100%',
          maxWidth: 400,
          backgroundColor: 'rgba(255,255,255,0.82)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderRadius: 28,
          border: '1px solid rgba(74,158,237,0.2)',
          boxShadow: '0 24px 60px rgba(32,87,160,0.18)',
          padding: '44px 40px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 24,
        }}
      >
        <img src="/meal-planner-logo.svg" alt="MealHouse" style={{ height: 52, width: 52 }} />

        <div style={{ textAlign: 'center' }}>
          <h1
            style={{
              margin: '0 0 8px 0',
              fontSize: '1.75rem',
              fontWeight: 900,
              color: '#0f2a4a',
              letterSpacing: '-0.03em',
            }}
          >
            Welcome back
          </h1>
          <p style={{ margin: 0, color: '#4a7faa', fontSize: '0.95rem', fontWeight: 500 }}>
            Sign in to access your family's app
          </p>
        </div>

        {error && (
          <div
            style={{
              width: '100%',
              padding: '12px 16px',
              backgroundColor: 'rgba(220,60,60,0.08)',
              border: '1px solid rgba(220,60,60,0.25)',
              borderRadius: 12,
              color: '#c0392b',
              fontSize: '0.88rem',
              fontWeight: 600,
              textAlign: 'center',
            }}
          >
            {error}
          </div>
        )}

        <button
          onClick={handleSignIn}
          disabled={loading}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            padding: '14px 24px',
            backgroundColor: loading ? 'hsl(var(--cta-bg) / 0.5)' : 'hsl(var(--cta-bg))',
            color: '#fff',
            border: 'none',
            borderRadius: 100,
            fontSize: '1rem',
            fontWeight: 700,
            fontFamily: 'inherit',
            cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: '0 6px 20px rgba(26,58,92,0.28)',
            transition: 'background-color 0.2s',
            minHeight: 'unset',
          }}
          onMouseEnter={(e) => {
            if (!loading) (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'hsl(var(--cta-hover))';
          }}
          onMouseLeave={(e) => {
            if (!loading) (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'hsl(var(--cta-bg))';
          }}
        >
          {/* Google G */}
          {!loading && (
            <svg width="20" height="20" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
          )}
          {loading ? 'Signing in…' : 'Continue with Google'}
        </button>

        <p style={{ margin: 0, fontSize: '0.8rem', color: '#7aabcc', textAlign: 'center' }}>
          New here?{' '}
          <button
            onClick={() => navigate('/onboarding')}
            style={{
              background: 'none',
              border: 'none',
              color: '#2d6fa8',
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontSize: 'inherit',
              padding: 0,
              minHeight: 'unset',
            }}
          >
            Build your app →
          </button>
        </p>
      </div>
    </div>
  );
}
