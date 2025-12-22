
import React, { useState } from 'react';
import type { User } from '../types';
import { MenuIcon } from './icons/MenuIcon';
import { XIcon } from './icons/XIcon';

interface HeaderProps {
  user: User;
  onLogout: () => void;
  activeView: 'table' | 'calculator' | 'users';
  onViewChange: (view: 'table' | 'calculator' | 'users') => void;
}

const Header: React.FC<HeaderProps> = ({ user, onLogout, activeView, onViewChange }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const activeTabClass = "bg-yellow-400 text-gray-900 shadow-sm";
  const inactiveTabClass = "text-gray-600 hover:bg-yellow-200 hover:text-gray-800";
  const mobileLinkClass = "block px-3 py-2.5 rounded-md text-sm font-bold transition-colors";

  const isAdmin = user.role === 'admin';

  const handleViewChange = (view: 'table' | 'calculator' | 'users') => {
    onViewChange(view);
    setIsMenuOpen(false);
  }

  return (
    <header className="bg-white shadow-md sticky top-0 z-20">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-14 sm:h-16 md:h-20">
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-7 sm:w-7 md:h-10 md:w-10 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L9 5.414V17a1 1 0 102 0V5.414l5.293 5.293a1 1 0 001.414-1.414l-7-7z" />
            </svg>
            <h1 className="text-sm sm:text-base md:text-2xl font-black text-gray-800 ml-1.5 whitespace-nowrap tracking-tight">TABELA TÁXI</h1>
          </div>
          
          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-3">
            <div className="bg-gray-100 p-0.5 rounded-full flex items-center">
              <button 
                onClick={() => handleViewChange('table')}
                className={`px-3 py-1.5 lg:px-5 lg:py-2 rounded-full text-xs lg:text-sm font-bold transition-all duration-300 ${activeView === 'table' ? activeTabClass : inactiveTabClass}`}>
                Bairro/Hotel
              </button>
              <button 
                onClick={() => handleViewChange('calculator')}
                className={`px-3 py-1.5 lg:px-5 lg:py-2 rounded-full text-xs lg:text-sm font-bold transition-all duration-300 ${activeView === 'calculator' ? activeTabClass : inactiveTabClass}`}>
                Viagens Longas
              </button>
              {isAdmin && (
                <button 
                  onClick={() => handleViewChange('users')}
                  className={`px-3 py-1.5 lg:px-5 lg:py-2 rounded-full text-xs lg:text-sm font-bold transition-all duration-300 ${activeView === 'users' ? activeTabClass : inactiveTabClass}`}>
                  Usuários
                </button>
              )}
            </div>
            
            <button
              onClick={onLogout}
              className="px-3 py-1.5 lg:px-4 lg:py-2 bg-red-500 text-white text-xs lg:text-sm font-bold rounded-full hover:bg-red-600 transition-colors"
            >
              Sair
            </button>
          </div>
          
          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-1.5 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none"
            >
              <span className="sr-only">Menu</span>
              {isMenuOpen ? <XIcon className="block h-5 w-5" /> : <MenuIcon className="block h-5 w-5" />}
            </button>
          </div>

        </div>
      </div>
      
      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white animate-in slide-in-from-top-2 duration-200">
          <div className="px-3 py-2 space-y-1">
            <button onClick={() => handleViewChange('table')} className={`w-full text-left ${mobileLinkClass} ${activeView === 'table' ? activeTabClass : inactiveTabClass}`}>Bairro/Hotel</button>
            <button onClick={() => handleViewChange('calculator')} className={`w-full text-left ${mobileLinkClass} ${activeView === 'calculator' ? activeTabClass : inactiveTabClass}`}>Viagens Longas</button>
            {isAdmin && <button onClick={() => handleViewChange('users')} className={`w-full text-left ${mobileLinkClass} ${activeView === 'users' ? activeTabClass : inactiveTabClass}`}>Usuários</button>}
          </div>
          <div className="px-3 py-3 border-t border-gray-100 flex items-center justify-between">
            <div className="text-[10px] font-bold text-gray-400 truncate max-w-[50%] tracking-tight">{user.email}</div>
            <button
                onClick={onLogout}
                className="bg-red-500 px-3 py-1.5 text-white text-[10px] font-bold rounded-full hover:bg-red-600 active:scale-95 transition-transform"
            >
                Sair
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
