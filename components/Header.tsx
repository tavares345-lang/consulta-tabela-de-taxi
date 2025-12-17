
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
  const mobileLinkClass = "block px-4 py-3 rounded-md text-xl font-medium";

  const isAdmin = user.role === 'admin';

  const handleViewChange = (view: 'table' | 'calculator' | 'users') => {
    onViewChange(view);
    setIsMenuOpen(false);
  }

  return (
    <header className="bg-white shadow-md sticky top-0 z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-24">
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L9 5.414V17a1 1 0 102 0V5.414l5.293 5.293a1 1 0 001.414-1.414l-7-7z" />
            </svg>
            <h1 className="text-4xl font-bold text-gray-800 ml-4">TABELA TÁXI</h1>
          </div>
          
          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-6">
            <div className="bg-gray-200 p-1.5 rounded-full flex items-center">
              <button 
                onClick={() => handleViewChange('table')}
                className={`px-6 py-3 rounded-full text-lg font-bold transition-all duration-300 ${activeView === 'table' ? activeTabClass : inactiveTabClass}`}>
                Bairro/Hotel
              </button>
              <button 
                onClick={() => handleViewChange('calculator')}
                className={`px-6 py-3 rounded-full text-lg font-bold transition-all duration-300 ${activeView === 'calculator' ? activeTabClass : inactiveTabClass}`}>
                Viagens Longas
              </button>
              {isAdmin && (
                <button 
                  onClick={() => handleViewChange('users')}
                  className={`px-6 py-3 rounded-full text-lg font-bold transition-all duration-300 ${activeView === 'users' ? activeTabClass : inactiveTabClass}`}>
                  Usuários
                </button>
              )}
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-lg font-medium text-gray-700 hidden lg:block">{user.email}</span>
              <button
                onClick={onLogout}
                className="px-6 py-3 bg-red-500 text-white text-lg font-bold rounded-full hover:bg-red-600 transition-colors"
                title="Sair"
              >
                Sair
              </button>
            </div>
          </div>
          
          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-3 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-yellow-500"
              aria-expanded="false"
            >
              <span className="sr-only">Abrir menu principal</span>
              {isMenuOpen ? <XIcon className="block h-10 w-10" /> : <MenuIcon className="block h-10 w-10" />}
            </button>
          </div>

        </div>
      </div>
      
      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-gray-200">
          <div className="px-2 pt-4 pb-4 space-y-2 sm:px-3">
            <button onClick={() => handleViewChange('table')} className={`w-full text-left ${mobileLinkClass} ${activeView === 'table' ? activeTabClass : inactiveTabClass}`}>Bairro/Hotel</button>
            <button onClick={() => handleViewChange('calculator')} className={`w-full text-left ${mobileLinkClass} ${activeView === 'calculator' ? activeTabClass : inactiveTabClass}`}>Viagens Longas</button>
            {isAdmin && <button onClick={() => handleViewChange('users')} className={`w-full text-left ${mobileLinkClass} ${activeView === 'users' ? activeTabClass : inactiveTabClass}`}>Usuários</button>}
          </div>
          <div className="pt-5 pb-5 border-t border-gray-200">
            <div className="flex items-center justify-between px-6">
                <div>
                    <div className="text-xl font-bold text-gray-800">{user.email}</div>
                    <div className="text-lg font-medium text-gray-500">{user.role}</div>
                </div>
                <button
                    onClick={onLogout}
                    className="ml-auto flex-shrink-0 bg-red-500 px-6 py-3 text-white text-lg rounded-full hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white"
                    title="Sair"
                >
                    Sair
                </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
