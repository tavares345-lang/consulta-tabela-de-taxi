
import React, { useState } from 'react';
import type { User } from '../types';
import * as authService from '../services/authService';

interface AuthPageProps {
  onLoginSuccess: (user: User) => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ onLoginSuccess }) => {
  const [isLoginView, setIsLoginView] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (isLoginView) {
      const result = authService.login(email, password);
      if (result.success && result.user) {
        onLoginSuccess(result.user);
      } else {
        setError(result.message);
      }
    } else {
      if (password !== confirmPassword) {
        setError('As senhas não coincidem.');
        return;
      }
      const result = authService.register(email, password);
      if (result.success) {
        setSuccess('Cadastro realizado com sucesso! Faça o login para continuar.');
        setIsLoginView(true);
        setEmail('');
        setPassword('');
        setConfirmPassword('');
      } else {
        setError(result.message);
      }
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-6 bg-cover bg-center bg-no-repeat bg-slate-900"
      style={{ 
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), url('/login_bg.png')`,
      }}
    >
      <div className="w-full max-w-xl bg-white/90 backdrop-blur-md dark:bg-gray-800/90 rounded-3xl shadow-2xl p-10 sm:p-14 border border-white/20">
        <div className="text-center mb-12">
          <div className="w-20 h-2 bg-blue-600 mx-auto mb-6 rounded-full"></div>
          <h1 className="text-5xl font-black text-gray-900 dark:text-white tracking-tighter uppercase">TABELA TÁXI</h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 mt-3 font-bold uppercase tracking-widest">
            {isLoginView ? 'Acesso Restrito' : 'Criar Nova Conta'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Usuário ou E-mail</label>
            <input
                type="text"
                placeholder="Ex: Admin ou seu e-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-6 py-5 text-xl bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-2xl text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-4 focus:ring-blue-500/30 transition-all font-medium"
                required
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Senha de Acesso</label>
            <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-6 py-5 text-xl bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-2xl text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-4 focus:ring-blue-500/30 transition-all font-medium"
                required
            />
          </div>
          {!isLoginView && (
            <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Confirme sua Senha</label>
                <input
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-6 py-5 text-xl bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-2xl text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-4 focus:ring-blue-500/30 transition-all font-medium"
                required
                />
            </div>
          )}

          {error && <p className="text-red-500 text-sm text-center font-black uppercase tracking-widest bg-red-50 border border-red-100 p-4 rounded-xl">{error}</p>}
          {success && <p className="text-green-500 text-sm text-center font-black uppercase tracking-widest bg-green-50 border border-green-100 p-4 rounded-xl">{success}</p>}

          <button
            type="submit"
            className="w-full bg-blue-600 text-white font-black py-6 px-8 rounded-2xl hover:bg-blue-700 active:scale-[0.98] transition-all duration-200 shadow-[0_10px_40px_rgba(37,99,235,0.4)] text-xl uppercase tracking-widest mt-4"
          >
            {isLoginView ? 'Entrar no Sistema' : 'Finalizar Cadastro'}
          </button>
        </form>

        <div className="text-center mt-12 bg-gray-50/50 dark:bg-gray-900/50 -mx-10 sm:-mx-14 -mb-10 sm:-mb-14 p-8 border-t border-gray-100 dark:border-gray-700 rounded-b-3xl">
          <button
            onClick={() => {
                setIsLoginView(!isLoginView);
                setError(null);
                setSuccess(null);
            }}
            className="text-sm text-blue-600 hover:text-blue-700 font-black uppercase tracking-widest"
          >
            {isLoginView ? 'Não tem uma conta? Clique aqui' : 'Já é cadastrado? Faça Login'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
