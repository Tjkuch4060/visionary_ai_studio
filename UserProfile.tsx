import React, { useState, useRef, useEffect } from 'react';

interface UserProfileProps {
  onOpenLibrary: () => void;
  onLogout: () => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ onOpenLibrary, onLogout }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center h-10 w-10 rounded-full bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-indigo-500"
        aria-label="Open user menu"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      </button>
      {isOpen && (
        <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-gray-800 ring-1 ring-black ring-opacity-5 focus:outline-none z-20">
          <button
            onClick={() => {
              onOpenLibrary();
              setIsOpen(false);
            }}
            className="w-full text-left block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700"
            role="menuitem"
          >
            My Library
          </button>
          <div className="border-t border-gray-700 my-1"></div>
           <button
            onClick={() => {
              onLogout();
              setIsOpen(false);
            }}
            className="w-full text-left block px-4 py-2 text-sm text-red-400 hover:bg-gray-700"
            role="menuitem"
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
};

export default UserProfile;