import React, { useState } from 'react';

interface LoginProps {
  onLoginSuccess: () => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
        setError("Please provide both email and password.");
        return;
    }
    setError(null);
    setIsLoggingIn(true);
    
    // Simulate API call for login
    setTimeout(() => {
      onLoginSuccess();
      // No need to set isLoggingIn to false as the component will unmount
    }, 1500);
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (error) setError(null);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (error) setError(null);
  };

  return (
    <>
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeInUp {
          animation: fadeInUp 0.6s ease-out forwards;
        }
      `}</style>
      <div className="min-h-screen bg-gray-900 flex flex-col justify-center items-center p-4 overflow-hidden" style={{background: 'radial-gradient(ellipse at top, #1e293b, #111827)'}}>
        <div className="w-full max-w-md">
          <header className="text-center mb-8 animate-fadeInUp" style={{ animationDelay: '100ms', opacity: 0 }}>
              <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-600">
                  Visionary AI Studio
              </h1>
              <p className="mt-2 text-lg text-gray-400">
                  Welcome back to the future of creation.
              </p>
          </header>
          <div 
            className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-8 shadow-2xl animate-fadeInUp"
            style={{ 
              animationDelay: '300ms', 
              opacity: 0, 
              boxShadow: '0 0 60px rgba(99, 102, 241, 0.15), 0 0 10px rgba(99, 102, 241, 0.1)' 
            }}
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300">
                  Email
                </label>
                <div className="mt-1">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={handleEmailChange}
                    className="block w-full rounded-md bg-gray-900 border-gray-600 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password"className="block text-sm font-medium text-gray-300">
                  Password
                </label>
                <div className="mt-1">
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={handlePasswordChange}
                    className="block w-full rounded-md bg-gray-900 border-gray-600 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
              </div>
              
              <div className={`h-6 transition-opacity duration-300 ${error ? 'opacity-100' : 'opacity-0'}`}>
                {error && (
                    <div className="text-red-400 text-sm text-center bg-red-900/30 border border-red-800/50 rounded-md py-1">
                        {error}
                    </div>
                )}
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoggingIn}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-indigo-500 disabled:bg-indigo-900/50 disabled:cursor-not-allowed"
                >
                  {isLoggingIn ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Signing In...
                    </>
                  ) : 'Sign In'}
                </button>
              </div>
              <div className="text-sm text-center">
                  <a href="#" className="font-medium text-indigo-400 hover:text-indigo-300">
                    Forgot your password?
                  </a>
              </div>
            </form>
          </div>
           <div className="mt-8 text-center text-sm text-gray-400 animate-fadeInUp" style={{ animationDelay: '500ms', opacity: 0 }}>
              Don't have an account?{' '}
              <a href="#" className="font-medium text-indigo-400 hover:text-indigo-300">
                Sign Up
              </a>
            </div>
        </div>
      </div>
    </>
  );
};

export default Login;
