import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

export function StorefrontStepper() {
  const location = useLocation();
  const path = location.pathname;

  let currentStep = 1;
  if (path === '/onboarding') currentStep = 2;
  if (path === '/auth') currentStep = 3;

  const steps = [
    { num: 1, label: 'Step 1: Getting Started' },
    { num: 2, label: 'Step 2: Build Your App' },
    { num: 3, label: 'Step 3: Connect' },
  ];

  return (
    <div className="hidden lg:flex absolute left-1/2 -translate-x-1/2 top-7 items-start z-50 pointer-events-none">
      {steps.map((step, index) => {
        const isActive = currentStep === step.num;
        const isCompleted = currentStep > step.num;
        const isLast = index === steps.length - 1;

        return (
          <div key={step.num} className="flex items-start">
            <div className="flex flex-col items-center relative" style={{ width: 160 }}>
              <motion.div 
                className="w-5 h-5 z-10 transition-all duration-500 flex items-center justify-center"
                style={{
                  color: isActive || isCompleted ? 'hsl(var(--cta-bg))' : 'hsl(var(--text-secondary))',
                  opacity: isActive || isCompleted ? 1 : 0.3,
                  filter: isActive 
                    ? 'drop-shadow(0 0 8px rgba(20, 83, 45, 0.5))' 
                    : 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
                }}
              >
                <svg viewBox="0 0 1500 1500" fill="currentColor" className="w-full h-full">
                  <path d="M 817.539062 73.03125 L 1266.914062 289.851562 C 1309.597656 310.449219 1340.582031 349.363281 1351.09375 395.574219 L 1461.101562 879.273438 C 1471.613281 925.492188 1460.515625 973.980469 1430.945312 1011.023438 L 1119.714844 1400.945312 C 1090.144531 1437.988281 1045.324219 1459.558594 997.929688 1459.558594 L 502.054688 1459.558594 C 454.65625 1459.558594 409.835938 1437.988281 380.269531 1400.945312 L 69.035156 1011.023438 C 39.46875 973.980469 28.371094 925.492188 38.882812 879.273438 L 148.890625 395.574219 C 159.402344 349.363281 190.386719 310.449219 233.070312 289.851562 L 682.445312 73.03125 C 725.121094 52.441406 774.863281 52.441406 817.539062 73.03125 Z" />
                </svg>
              </motion.div>
              <span 
                className="text-[0.8rem] font-bold text-center mt-3 transition-colors duration-500 leading-tight"
                style={{
                  color: isActive || isCompleted ? 'hsl(var(--text-primary))' : 'hsl(var(--text-secondary))',
                  opacity: isActive ? 1 : isCompleted ? 0.8 : 0.5
                }}
              >
                {step.label}
              </span>
            </div>

            {!isLast && (
              <div className="h-[2px] mt-[4px] z-0 relative overflow-hidden rounded-full" style={{ width: 100, marginLeft: -20, marginRight: -20 }}>
                <div className="absolute inset-0" style={{ backgroundColor: 'hsl(var(--text-secondary))', opacity: 0.15 }} />
                <motion.div 
                  className="absolute inset-0 origin-left"
                  style={{ backgroundColor: 'hsl(var(--cta-bg))' }}
                  initial={false}
                  animate={{ scaleX: isCompleted ? 1 : 0 }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
