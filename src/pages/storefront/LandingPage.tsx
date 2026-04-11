import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../../config/firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

export default function LandingPage() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      // Optional: force account selection
      // provider.setCustomParameters({ prompt: 'select_account' });
      await signInWithPopup(auth, provider);
      // Once signed in, navigate to onboarding explicitly
      navigate('/onboarding');
    } catch (error) {
      console.error("Google Sign In Error:", error);
      alert("Failed to sign in. Please check your configuration.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <div className="max-w-3xl w-full text-center space-y-8">
        <h1 className="text-5xl font-extrabold text-slate-900 tracking-tight">
          Your Family's Proprietary Meal Planning App
        </h1>
        <p className="text-xl text-slate-600">
          Zero setup. Powered by AI. Designed explicitly for your household.
        </p>
        <div className="pt-8">
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="inline-flex items-center justify-center px-8 py-4 text-lg font-medium text-white bg-blue-600 rounded-full hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 disabled:opacity-50"
          >
            {loading ? 'Signing In...' : 'Sign In With Google'}
          </button>
        </div>
      </div>
    </div>
  );
}
