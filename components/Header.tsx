
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
  
  const activeTabClass = "bg-yellow-400 text-gray-900 shadow-md transform scale-105";
  const inactiveTabClass = "text-gray-500 hover:bg-gray-100 hover:text-gray-800";
  const mobileLinkClass = "block px-4 py-3 rounded-xl text-sm font-black transition-all uppercase tracking-widest";

  const isAdmin = user.role === 'admin';

  const handleViewChange = (view: 'table' | 'calculator' | 'users') => {
    onViewChange(view);
    setIsMenuOpen(false);
  }

  return (
    <header className="bg-white shadow-md border-b border-gray-100 sticky top-0 z-20">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16 sm:h-20">
          <div className="flex items-center group cursor-pointer" onClick={() => handleViewChange('table')}>
            <div className="bg-yellow-400 p-1.5 rounded-lg shadow-sm group-hover:rotate-12 transition-transform">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-900" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L9 5.414V17a1 1 0 102 0V5.414l5.293 5.293a1 1 0 001.414-1.414l-7-7z" />
                </svg>
            </div>
            <h1 className="text-sm sm:text-lg md:text-2xl font-black text-gray-900 ml-3 whitespace-nowrap tracking-tighter uppercase">Tabela Táxi</h1>
          </div>
          
          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-4">
            <div className="bg-gray-50 p-1.5 rounded-2xl flex items-center border border-gray-100 shadow-inner">
              <button 
                onClick={() => handleViewChange('table')}
                className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 ${activeView === 'table' ? activeTabClass : inactiveTabClass}`}>
                Bairro/Hotel
              </button>
              <button 
                onClick={() => handleViewChange('calculator')}
                className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 ${activeView === 'calculator' ? activeTabClass : inactiveTabClass}`}>
                Viagens Longas
              </button>
              {isAdmin && (
                <button 
                  onClick={() => handleViewChange('users')}
                  className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 ${activeView === 'users' ? activeTabClass : inactiveTabClass}`}>
                  Gestão
                </button>
              )}
            </div>
            
            <button
              onClick={onLogout}
              className="px-5 py-2 bg-red-50 text-red-600 text-xs font-black uppercase tracking-widest rounded-xl hover:bg-red-100 transition-all border border-red-100 shadow-sm"
            >
              Sair
            </button>
          </div>
          
          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-xl bg-gray-50 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all focus:outline-none border border-gray-100"
            >
              {isMenuOpen ? <XIcon className="h-6 w-6" /> : <MenuIcon className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile Menu Dropdown */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-gray-50 bg-white shadow-2xl animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="px-4 py-4 space-y-2">
            <button onClick={() => handleViewChange('table')} className={`w-full text-center ${mobileLinkClass} ${activeView === 'table' ? activeTabClass : inactiveTabClass}`}>Bairro/Hotel</button>
            <button onClick={() => handleViewChange('calculator')} className={`w-full text-center ${mobileLinkClass} ${activeView === 'calculator' ? activeTabClass : inactiveTabClass}`}>Viagens Longas</button>
            {isAdmin && <button onClick={() => handleViewChange('users')} className={`w-full text-center ${mobileLinkClass} ${activeView === 'users' ? activeTabClass : inactiveTabClass}`}>Gestão Usuários</button>}
          </div>
          <div className="px-6 py-5 border-t border-gray-50 bg-gray-50/50 flex flex-col items-center space-y-4">
            <span className="text-xs text-gray-500 font-black uppercase tracking-tighter truncate max-w-full">{user.email}</span>
            <button
                onClick={onLogout}
                className="w-full bg-red-600 text-white text-xs font-black py-3 rounded-xl hover:bg-red-700 shadow-md uppercase tracking-widest"
            >
                Encerrar Sessão
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
