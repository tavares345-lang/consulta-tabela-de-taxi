
import React, { useState } from 'react';
import type { User } from '../types';
import * as authService from '../services/authService';

interface AuthPageProps {
  onLoginSuccess: (user: User) => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await authService.login(email, password);
      if (result.success && result.user) {
        onLoginSuccess(result.user);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Erro ao conectar ao banco de dados.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-cover bg-center bg-no-repeat bg-slate-900"
      style={{ 
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), url('/login_bg.png')`,
      }}
    >
      <div className="w-full max-w-md bg-white/95 backdrop-blur-md dark:bg-gray-800/95 rounded-[2.5rem] shadow-2xl p-8 sm:p-12 border border-white/20">
        <div className="text-center mb-8 sm:mb-12">
          <div className="w-16 h-1.5 bg-blue-600 mx-auto mb-5 rounded-full"></div>
          <h1 className="text-3xl sm:text-5xl font-black text-gray-900 dark:text-white tracking-tighter uppercase">TABELA TÁXI</h1>
          <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mt-2 font-bold uppercase tracking-widest">
            Acesso Restrito
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          <div>
            <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Usuário ou E-mail</label>
            <input
                type="text"
                placeholder="Ex: Admin ou seu e-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-5 py-4 text-base bg-white dark:bg-gray-700 border border-gray-100 dark:border-gray-600 rounded-2xl text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-4 focus:ring-blue-500/20 transition-all font-medium shadow-sm"
                required
            />
          </div>
          <div>
            <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Senha de Acesso</label>
            <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-5 py-4 text-base bg-white dark:bg-gray-700 border border-gray-100 dark:border-gray-600 rounded-2xl text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-4 focus:ring-blue-500/20 transition-all font-medium shadow-sm"
                required
            />
          </div>

          {error && <p className="text-red-500 text-[10px] text-center font-black uppercase tracking-widest bg-red-50 border border-red-100 p-3 rounded-xl">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white font-black py-5 px-8 rounded-2xl hover:bg-blue-700 active:scale-[0.98] transition-all duration-200 shadow-xl shadow-blue-500/20 text-base uppercase tracking-widest mt-2 disabled:opacity-75 disabled:cursor-not-allowed"
          >
            {loading ? 'Conectando...' : 'Entrar no Sistema'}
          </button>
        </form>

        <div className="text-center mt-10 sm:mt-12 bg-gray-50/70 dark:bg-gray-900/70 -mx-8 sm:-mx-12 -mb-8 sm:-mb-12 p-6 border-t border-gray-100 dark:border-gray-700 rounded-b-[2.5rem]">
          <p className="text-[11px] text-gray-600 dark:text-gray-300 font-extrabold uppercase tracking-wider mb-3">
            Para acessar, solicitar alteração, inclusão ou suporte:
          </p>
          <a
            href="https://wa.me/5531998699742?text=Ol%C3%A1!%20Gostaria%20de%20solicitar%20acesso%2C%20altera%C3%A7%C3%A3o%20ou%20suporte%20no%20aplicativo%20Tabela%20T%C3%A1xi."
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-xs uppercase tracking-wider py-3 px-5 rounded-xl shadow-md transition-all w-full"
          >
            <span>Falar com Administrador: (31) 99869-9742</span>
          </a>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
