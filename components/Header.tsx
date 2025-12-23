
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
  const inactiveTabClass = "text-gray-500 hover:bg-gray-100 hover:text-gray-800";
  const mobileLinkClass = "block px-3 py-2 rounded-md text-xs font-bold transition-colors";

  const isAdmin = user.role === 'admin';

  const handleViewChange = (view: 'table' | 'calculator' | 'users') => {
    onViewChange(view);
    setIsMenuOpen(false);
  }

  return (
    <header className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-20">
      <div className="max-w-7xl mx-auto px-3">
        <div className="flex items-center justify-between h-12 sm:h-14">
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-6 sm:w-6 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L9 5.414V17a1 1 0 102 0V5.414l5.293 5.293a1 1 0 001.414-1.414l-7-7z" />
            </svg>
            <h1 className="text-xs sm:text-sm md:text-xl font-black text-gray-800 ml-1.5 whitespace-nowrap tracking-tight uppercase">Tabela Táxi</h1>
          </div>
          
          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-2">
            <div className="bg-gray-50 p-0.5 rounded-full flex items-center border border-gray-100">
              <button 
                onClick={() => handleViewChange('table')}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all duration-200 ${activeView === 'table' ? activeTabClass : inactiveTabClass}`}>
                Bairro/Hotel
              </button>
              {isAdmin && (
                <button 
                  onClick={() => handleViewChange('calculator')}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all duration-200 ${activeView === 'calculator' ? activeTabClass : inactiveTabClass}`}>
                  Calculadora
                </button>
              )}
              {isAdmin && (
                <button 
                  onClick={() => handleViewChange('users')}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all duration-200 ${activeView === 'users' ? activeTabClass : inactiveTabClass}`}>
                  Usuários
                </button>
              )}
            </div>
            
            <button
              onClick={onLogout}
              className="px-3 py-1 bg-red-50 text-red-600 text-xs font-bold rounded-full hover:bg-red-100 transition-colors border border-red-100"
            >
              Sair
            </button>
          </div>
          
          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 focus:outline-none"
            >
              {isMenuOpen ? <XIcon className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile Menu Dropdown */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-gray-50 bg-white shadow-lg animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="px-3 py-2 space-y-1">
            <button onClick={() => handleViewChange('table')} className={`w-full text-left ${mobileLinkClass} ${activeView === 'table' ? activeTabClass : inactiveTabClass}`}>Bairro/Hotel</button>
            {isAdmin && <button onClick={() => handleViewChange('calculator')} className={`w-full text-left ${mobileLinkClass} ${activeView === 'calculator' ? activeTabClass : inactiveTabClass}`}>Calculadora</button>}
            {isAdmin && <button onClick={() => handleViewChange('users')} className={`w-full text-left ${mobileLinkClass} ${activeView === 'users' ? activeTabClass : inactiveTabClass}`}>Usuários</button>}
          </div>
          <div className="px-3 py-2 border-t border-gray-50 flex items-center justify-between">
            <span className="text-[10px] text-gray-400 font-medium truncate">{user.email}</span>
            <button
                onClick={onLogout}
                className="text-red-600 text-[10px] font-bold px-2 py-1 rounded-md hover:bg-red-50"
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
