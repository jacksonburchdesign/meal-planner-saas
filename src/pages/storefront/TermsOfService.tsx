import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'iconoir-react';

export default function TermsOfService() {
  return (
    <div style={{
      minHeight: '100dvh',
      width: '100%',
      backgroundColor: '#f8fafc',
      fontFamily: '"Inter", system-ui, sans-serif',
      color: '#0d2540',
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
            color: '#1f60a8', 
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
          <h1 style={{ fontFamily: '"League Spartan", system-ui, sans-serif', fontSize: '3rem', margin: '0 0 8px 0', color: '#0f2a4a' }}>Terms of Service</h1>
          <p style={{ color: '#5a89b0', margin: '0 0 32px 0' }}>Last updated: {new Date().toLocaleDateString()}</p>
          
          <div style={{ lineHeight: 1.7, fontSize: '1.05rem', color: '#334155' }}>
            <h2>1. Acceptance of Terms</h2>
            <p>By accessing or using MealHouse (the "Service"), you agree to be bound by these Terms of Service. If you do not agree to all the terms and conditions outlined here, you may not access or use the Service.</p>

            <h2>2. Description of Service</h2>
            <p>MealHouse provides a multi-tenant web application intended to help families organize recipes, automate meal planning, and generate shopping lists. Our AI-assisted features rely on third-party computational algorithms to organize recipes or suggest meal schedules.</p>
            
            <h2>3. Subscriptions and Payments</h2>
            <p>Certain features of the Service are billed on a subscription basis (e.g. $2.99/month). You will be billed in advance on a recurring and periodic basis. Valid payment details must be provided. You may cancel your subscription at any time; however, there are no refunds for partially used billing periods.</p>
            
            <h2>4. Disclaimer of Nutritional Accuracy</h2>
            <p>MealHouse and its AI integrations occasionally suggest pairings, side dishes, or parse ingredient quantities. <strong>We do not guarantee the nutritional accuracy, dietary safety, or validity of any generated plans or imported recipes.</strong> Always exercise personal judgment regarding allergies, caloric intake, and food safety.</p>
            
            <h2>5. Intellectual Property & User Content</h2>
            <p>You retain full ownership of any original recipes or content you upload. By importing or uploading content into MealHouse, you grant us a temporary license to process, display, and structure that content across your authorized family tenant. We are not liable for copyright infringements resulting from URLs you scrape or paste into your private library.</p>

            <h2>6. Limitation of Liability</h2>
            <p>In no event shall MealHouse, nor its directors, employees, or partners, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your use of the Service.</p>

            <h2>7. Contact Us</h2>
            <p>If you have any questions about these Terms of Service, please contact us at <strong>support@mealhouse.app</strong>.</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
