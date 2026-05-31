import React, { useState, useEffect } from 'react';
import * as authService from '../services/authService';
import type { User } from '../types';
import { TrashIcon } from './icons/TrashIcon';

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'user' | 'admin'>('user');
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const allUsers = await authService.getAllUsers();
      // Ensure "admin" is always visible if not returned by Firestore
      const hasAdmin = allUsers.some(u => u.email.toLowerCase() === 'admin');
      if (!hasAdmin) {
        setUsers([
          { email: 'admin', role: 'admin', createdAt: new Date().toISOString() },
          ...allUsers
        ]);
      } else {
        setUsers(allUsers);
      }
    } catch (e) {
      setActionError('Erro ao carregar usuários do banco de dados.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleDeleteUser = async (email: string) => {
    if (window.confirm(`Tem certeza que deseja excluir o usuário ${email}?`)) {
        setSaving(true);
        setActionError(null);
        setActionSuccess(null);
        try {
            const success = await authService.deleteUser(email);
            if (success) {
                await loadUsers();
                setActionSuccess(`Usuário ${email} excluído com sucesso.`);
            } else {
                setActionError('Erro ao excluir usuário.');
            }
        } catch (error) {
            setActionError('Erro ao conectar ao banco para excluir o usuário.');
        } finally {
            setSaving(false);
        }
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    setActionSuccess(null);

    const emailTrimmed = newEmail.trim();
    if (!emailTrimmed) {
      setActionError('O nome de usuário ou e-mail é obrigatório.');
      return;
    }

    if (!newPassword) {
      setActionError('A senha é obrigatória.');
      return;
    }

    setSaving(true);
    try {
      const result = await authService.register(emailTrimmed, newPassword, newRole);
      if (result.success) {
        setActionSuccess(`Usuário "${emailTrimmed}" cadastrado com sucesso!`);
        setNewEmail('');
        setNewPassword('');
        setNewRole('user');
        await loadUsers();
      } else {
        setActionError(result.message);
      }
    } catch (error) {
      setActionError('Erro ao salvar no banco de dados.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Formulário de Cadastro */}
      <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8 h-fit border border-gray-100">
        <div className="mb-6 pb-4 border-b border-gray-100">
          <h2 className="text-2xl font-black text-gray-900 tracking-tight uppercase">Novo Cadastro</h2>
          <p className="text-xs text-gray-500 font-extrabold uppercase tracking-wider mt-1">Incluir operador ou admin</p>
        </div>

        <form onSubmit={handleAddUser} className="space-y-5">
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">E-mail ou Usuário</label>
            <input
              type="text"
              placeholder="Ex: joao ou joao@taxi.com"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="w-full px-4 py-3.5 text-base bg-gray-50 border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:ring-4 focus:ring-blue-500/20 transition-all font-medium"
              required
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Senha de Acesso</label>
            <input
              type="password"
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-3.5 text-base bg-gray-50 border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:ring-4 focus:ring-blue-500/20 transition-all font-medium"
              required
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Perfil / Permissão</label>
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value as 'user' | 'admin')}
              className="w-full px-4 py-3.5 text-base bg-gray-50 border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:ring-4 focus:ring-blue-500/20 transition-all font-medium appearance-none cursor-pointer"
            >
              <option value="user">Usuário Comum</option>
              <option value="admin">Administrador</option>
            </select>
          </div>

          {actionError && (
            <p className="text-red-600 text-xs text-center font-black uppercase tracking-wider bg-red-50 border border-red-100 p-3 rounded-xl">
              {actionError}
            </p>
          )}

          {actionSuccess && (
            <p className="text-green-600 text-xs text-center font-black uppercase tracking-wider bg-green-50 border border-green-100 p-3 rounded-xl">
              {actionSuccess}
            </p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-blue-600 text-white font-black py-4 px-6 rounded-xl hover:bg-blue-700 active:scale-[0.98] transition-all duration-200 shadow-lg shadow-blue-500/15 text-sm uppercase tracking-widest mt-2 disabled:opacity-75 disabled:cursor-not-allowed"
          >
            {saving ? 'CADASTRANDO...' : 'Cadastrar Usuário'}
          </button>
        </form>
      </div>

      {/* Lista de Usuários */}
      <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8 lg:col-span-2 border border-gray-100">
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
          <div>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight uppercase">Usuários Cadastrados</h2>
            <p className="text-xs text-gray-500 font-extrabold uppercase tracking-wider mt-1">Acesso permitido ao sistema</p>
          </div>
          <span className={`bg-blue-50 border border-blue-100 text-blue-700 font-black px-3.5 py-1.5 rounded-full text-xs uppercase tracking-wider ${loading ? 'animate-pulse' : ''}`}>
            {loading ? 'CARREGANDO...' : `${users.length} ATIVO(S)`}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="hidden md:table-header-group bg-gray-50 border-b border-gray-100">
              <tr>
                <th scope="col" className="px-6 py-4 text-left text-xs font-black text-gray-400 uppercase tracking-widest">E-mail / Usuário</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-black text-gray-400 uppercase tracking-widest">Perfil</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-black text-gray-400 uppercase tracking-widest">Data de Cadastro</th>
                <th scope="col" className="px-6 py-4 text-right text-xs font-black text-gray-400 uppercase tracking-widest">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-transparent md:bg-white md:divide-y md:divide-gray-100">
              {users.length > 0 ? users.map((user) => (
                <tr key={user.email} className="block md:table-row mb-6 md:mb-0 bg-white md:bg-transparent rounded-xl border md:border-0 border-gray-100 p-4 md:p-0 shadow-sm md:shadow-none hover:bg-gray-50/50 transition-colors">
                  <td className="px-0 py-2 md:px-6 md:py-4.5 whitespace-nowrap block md:table-cell">
                    <div className="flex justify-between items-center md:block">
                      <span className="font-black text-gray-400 md:hidden text-[10px] uppercase tracking-wider">E-mail</span>
                      <span className="text-base font-semibold text-gray-900">{user.email}</span>
                    </div>
                  </td>
                  <td className="px-0 py-2 md:px-6 md:py-4.5 whitespace-nowrap block md:table-cell">
                    <div className="flex justify-between items-center md:block">
                      <span className="font-black text-gray-400 md:hidden text-[10px] uppercase tracking-wider">Perfil</span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide border ${
                        user.role === 'admin' 
                          ? 'bg-purple-50 text-purple-700 border-purple-100' 
                          : 'bg-green-50 text-green-700 border-green-100'
                      }`}>
                        {user.role === 'admin' ? 'Admin' : 'Operador'}
                      </span>
                    </div>
                  </td>
                  <td className="px-0 py-2 md:px-6 md:py-4.5 whitespace-nowrap block md:table-cell">
                    <div className="flex justify-between items-center md:block">
                      <span className="font-black text-gray-400 md:hidden text-[10px] uppercase tracking-wider">Data de Cadastro</span>
                      <span className="text-sm font-medium text-gray-500">
                        {new Date(user.createdAt).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  </td>
                  <td className="px-0 py-2 md:px-6 md:py-4.5 whitespace-nowrap block md:table-cell text-right">
                    <div className="flex justify-end items-center md:block">
                      {user.email.toLowerCase() === 'admin' ? (
                        <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-widest bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-lg select-none">
                          Inexcluível
                        </span>
                      ) : (
                        <button 
                          onClick={() => handleDeleteUser(user.email)} 
                          className="p-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 hover:text-red-700 transition-colors border border-red-100/50" 
                          title="Excluir Usuário"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )) : (
                <tr className="block md:table-row">
                  <td colSpan={4} className="text-center py-12 text-gray-400 block text-lg font-bold uppercase tracking-wider">
                    Nenhum usuário cadastrado ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;
