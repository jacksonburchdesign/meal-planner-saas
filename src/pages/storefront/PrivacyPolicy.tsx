import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'iconoir-react';

export default function PrivacyPolicy() {
  return (
    <div style={{
      minHeight: '100dvh',
      width: '100%',
      backgroundColor: '#f8fafc',
      fontFamily: '"Inter", system-ui, sans-serif',
      color: 'hsl(var(--text-primary))',
      padding: '40px 24px',
      boxSizing: 'border-box'
    }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <Link 
          to="/" 
          style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: 8, 
            color: 'hsl(var(--cta-bg))', 
            textDecoration: 'none',
            fontWeight: 600,
            marginBottom: 32
          }}
        >
          <ArrowLeft width={20} /> Back to Home
        </Link>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ backgroundColor: 'white', padding: '40px 48px', borderRadius: 24, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}
        >
          <h1 style={{ fontFamily: '"League Spartan", system-ui, sans-serif', fontSize: '3rem', margin: '0 0 8px 0', color: '#0f2a4a' }}>Privacy Policy</h1>
          <p style={{ color: '#5a89b0', margin: '0 0 32px 0' }}>Last updated: {new Date().toLocaleDateString()}</p>
          
          <div style={{ lineHeight: 1.7, fontSize: '1.05rem', color: '#334155' }}>
            <h2>1. Information We Collect</h2>
            <p>At MealHouse, we collect information you directly provide us during registration and everyday use including your name, email address, password, family member names (for profile sharing), and any recipe URLs, images, or manual text you import into the system.</p>

            <h2>2. How We Use Your Information</h2>
            <p>We use the information we collect strictly to operate, maintain, and provide the features of the MealHouse service. This includes utilizing your library size and history to generate AI meal plans customized to your family.</p>
            
            <h2>3. Third-Party Services & AI Processing</h2>
            <p>We utilize trusted third-party providers (like Google Firebase for backend infrastructure, and OpenAI/Anthropic APIs) to power recipe parsing and meal plan generation. Your recipes or meal history may be anonymized and passed to these language models exclusively for the purpose of returning meal recommendations or formatting recipes correctly. We do not sell your personal data to advertisers.</p>
            
            <h2>4. Cookies & Tracking</h2>
            <p>We use cookies and similar tracking technologies strictly to keep you authenticated inside your tenant space and to monitor basic website performance metrics (e.g. Google Analytics). We do not run third-party advertising trackers inside paid user workspaces.</p>
            
            <h2>5. Data Retention & Deletion</h2>
            <p>You can manage or delete your stored recipes at any time. Upon account termination, we allow a 30-day grace period for reactivation before your family workspace, including all recipes and planning history, is permanently purged from our active databases.</p>

            <h2>6. Contact Us</h2>
            <p>If you have any questions about this Privacy Policy, please contact us at <strong>privacy@mealhouse.app</strong>.</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
