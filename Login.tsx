import React, { useState } from 'react';
import Waves from './Waves';

interface LoginProps {
  onLoginSuccess: () => void;
}

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  form?: string; // For general sign-in errors
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [authMode, setAuthMode] = useState<'signIn' | 'signUp'>('signIn');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const clearForm = () => {
    setName('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setErrors({});
  }

  const handleToggleMode = (e: React.MouseEvent) => {
    e.preventDefault();
    setAuthMode(prev => prev === 'signIn' ? 'signUp' : 'signIn');
    clearForm();
  }
  
  const validateSignUp = (): FormErrors => {
    const newErrors: FormErrors = {};

    if (!name.trim()) newErrors.name = "Name is required.";
    
    if (!email.trim()) {
        newErrors.email = "Email is required.";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
        newErrors.email = "Please enter a valid email address.";
    } else if (email.toLowerCase() === 'test@example.com') { // Simulate existing user
        newErrors.email = "This email is already registered. Please sign in.";
    }

    if (!password) {
        newErrors.password = "Password is required.";
    } else {
        const passwordErrors = [];
        if (password.length < 8) passwordErrors.push("be at least 8 characters long");
        if (!/\d/.test(password)) passwordErrors.push("contain at least one number");
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) passwordErrors.push("contain at least one special character");
        if (passwordErrors.length > 0) {
            newErrors.password = `Password must ${passwordErrors.join(', ')}.`;
        }
    }

    if (!confirmPassword) {
        newErrors.confirmPassword = "Please confirm your password.";
    } else if (password && password !== confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match.";
    }
    
    return newErrors;
  }

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: FormErrors = {};
    if (!email.trim()) newErrors.email = "Email is required.";
    if (!password.trim()) newErrors.password = "Password is required.";
    
    if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
    }
    
    setErrors({});
    setIsSubmitting(true);
    
    setTimeout(() => {
      onLoginSuccess();
    }, 1500);
  };
  
  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validateSignUp();
    
    if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        return;
    }
    
    setErrors({});
    setIsSubmitting(true);

    setTimeout(() => {
      onLoginSuccess();
    }, 1500);
  };

  const handleChange = (
    setter: React.Dispatch<React.SetStateAction<string>>,
    fieldName: keyof FormErrors
  ) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setter(e.target.value);
      if (errors[fieldName]) {
          setErrors(prev => {
              const newErrors = { ...prev };
              delete newErrors[fieldName];
              return newErrors;
          });
      }
  };

  const isSignIn = authMode === 'signIn';

  return (
    <>
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeInUp { animation: fadeInUp 0.6s ease-out forwards; }
        
        .form-container-enter {
            animation: fadeInUp 0.5s ease-out forwards;
        }

        .waves { --x: 0px; --y: 0px; }
        .waves-canvas { display: block; width: 100%; height: 100%; }
        .waves::before {
          content: "";
          position: absolute;
          width: 200px;
          height: 200px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(99, 102, 241, 0.1) 0%, transparent 70%);
          pointer-events: none;
          transform: translate(calc(var(--x) - 100px), calc(var(--y) - 100px));
          transition: opacity 0.3s ease;
          opacity: 0;
        }
        .waves:hover::before { opacity: 1; }
      `}</style>
      <div className="min-h-screen bg-gray-900 flex flex-col justify-center items-center p-4 overflow-hidden relative">
        <Waves 
          className="z-0"
          lineColor="rgba(99, 102, 241, 0.25)"
        />
        <div className="w-full max-w-md z-10 relative">
          <header className="text-center mb-8 animate-fadeInUp" style={{ animationDelay: '100ms', opacity: 0 }}>
              <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-600">
                  Visionary AI Studio
              </h1>
              <p className="mt-2 text-lg text-gray-400">
                  {isSignIn ? "Welcome back to the future of creation." : "Join the future of creation today."}
              </p>
          </header>
          <div 
            key={authMode} // This key is crucial for re-triggering the animation on mode change
            className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-8 shadow-2xl form-container-enter"
            style={{ 
              boxShadow: '0 0 60px rgba(99, 102, 241, 0.15), 0 0 10px rgba(99, 102, 241, 0.1)' 
            }}
          >
            <form onSubmit={isSignIn ? handleSignIn : handleSignUp} className="space-y-4">
              {!isSignIn && (
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-300">Name</label>
                  <div className="mt-1">
                    <input id="name" name="name" type="text" autoComplete="name" value={name} onChange={handleChange(setName, 'name')} required className={`block w-full rounded-md bg-gray-900 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${errors.name ? 'border-red-500' : 'border-gray-600'}`} />
                  </div>
                  {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name}</p>}
                </div>
              )}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300">Email</label>
                <div className="mt-1">
                  <input id="email" name="email" type="email" autoComplete="email" value={email} onChange={handleChange(setEmail, 'email')} required className={`block w-full rounded-md bg-gray-900 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${errors.email ? 'border-red-500' : 'border-gray-600'}`} />
                </div>
                 {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email}</p>}
              </div>

              <div>
                <label htmlFor="password"className="block text-sm font-medium text-gray-300">Password</label>
                <div className="mt-1">
                  <input id="password" name="password" type="password" autoComplete={isSignIn ? "current-password" : "new-password"} value={password} onChange={handleChange(setPassword, 'password')} required className={`block w-full rounded-md bg-gray-900 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${errors.password ? 'border-red-500' : 'border-gray-600'}`} />
                </div>
                {errors.password && <p className="mt-1 text-xs text-red-400">{errors.password}</p>}
              </div>

               {!isSignIn && (
                <div>
                  <label htmlFor="confirm-password"className="block text-sm font-medium text-gray-300">Confirm Password</label>
                  <div className="mt-1">
                    <input id="confirm-password" name="confirm-password" type="password" autoComplete="new-password" value={confirmPassword} onChange={handleChange(setConfirmPassword, 'confirmPassword')} required className={`block w-full rounded-md bg-gray-900 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${errors.confirmPassword ? 'border-red-500' : 'border-gray-600'}`} />
                  </div>
                  {errors.confirmPassword && <p className="mt-1 text-xs text-red-400">{errors.confirmPassword}</p>}
                </div>
              )}
              
              <div className="pt-2">
                <button type="submit" disabled={isSubmitting} className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-indigo-500 disabled:bg-indigo-900/50 disabled:cursor-not-allowed">
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {isSignIn ? 'Signing In...' : 'Working Magic...'}
                    </>
                  ) : (isSignIn ? 'Sign In' : 'Show Me the Magic')}
                </button>
                 {!isSignIn && (
                    <p className="mt-3 text-center text-xs text-gray-500">
                        No signup required. 100% free trial.
                    </p>
                )}
              </div>
              {isSignIn && (
                <div className="text-sm text-center">
                    <a href="#" className="font-medium text-indigo-400 hover:text-indigo-300">
                      Forgot your password?
                    </a>
                </div>
              )}
            </form>
          </div>
           <div className="mt-8 text-center text-sm text-gray-400 animate-fadeInUp" style={{ animationDelay: '500ms', opacity: 0 }}>
              {isSignIn ? "Don't have an account?" : "Already have an account?"}{' '}
              <a href="#" onClick={handleToggleMode} className="font-medium text-indigo-400 hover:text-indigo-300">
                {isSignIn ? 'Sign Up' : 'Sign In'}
              </a>
            </div>
        </div>
      </div>
    </>
  );
};

export default Login;
