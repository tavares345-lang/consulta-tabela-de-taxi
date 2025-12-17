
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
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-6">
      <div className="w-full max-w-xl bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-10 sm:p-14">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-800 dark:text-white">TABELA TÁXI</h1>
          <p className="text-2xl text-gray-600 dark:text-gray-300 mt-4">
            {isLoginView ? 'Bem-vindo de volta' : 'Crie sua conta'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div>
            <input
                type="text"
                placeholder="E-mail ou 'Admin'"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-6 py-5 text-2xl bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-4 focus:ring-yellow-500/50"
                required
            />
          </div>
          <div>
            <input
                type="password"
                placeholder="Senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-6 py-5 text-2xl bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-4 focus:ring-yellow-500/50"
                required
            />
          </div>
          {!isLoginView && (
            <div>
                <input
                type="password"
                placeholder="Confirmar Senha"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-6 py-5 text-2xl bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-4 focus:ring-yellow-500/50"
                required
                />
            </div>
          )}

          {error && <p className="text-red-500 text-xl text-center font-bold bg-red-100 p-3 rounded">{error}</p>}
          {success && <p className="text-green-500 text-xl text-center font-bold bg-green-100 p-3 rounded">{success}</p>}

          <button
            type="submit"
            className="w-full bg-yellow-500 text-gray-900 font-extrabold py-5 px-8 rounded-xl hover:bg-yellow-600 transition-colors duration-300 shadow-lg text-2xl uppercase tracking-wide"
          >
            {isLoginView ? 'Entrar' : 'Cadastrar'}
          </button>
        </form>

        <div className="text-center mt-10">
          <button
            onClick={() => {
                setIsLoginView(!isLoginView);
                setError(null);
                setSuccess(null);
            }}
            className="text-xl text-yellow-600 hover:text-yellow-700 hover:underline font-semibold"
          >
            {isLoginView ? 'Não tem uma conta? Cadastre-se' : 'Já tem uma conta? Faça login'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
