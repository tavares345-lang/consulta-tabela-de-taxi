
import React, { useState, useEffect } from 'react';
import * as authService from '../services/authService';
import type { User } from '../types';
import { TrashIcon } from './icons/TrashIcon';

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);

  const loadUsers = () => {
    setUsers(authService.getAllUsers());
  };

  useEffect(() => {
    loadUsers();

    // Listen for storage changes (e.g., new user registered in another tab)
    const handleStorageChange = (event: StorageEvent) => {
        if (event.key === 'taxi_app_users') {
            loadUsers();
        }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleDeleteUser = (email: string) => {
    if (window.confirm(`Tem certeza que deseja excluir o usuário ${email}?`)) {
        const success = authService.deleteUser(email);
        if (success) {
            loadUsers();
            alert('Usuário excluído com sucesso.');
        } else {
            alert('Erro ao excluir usuário.');
        }
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-8">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-4xl font-bold text-gray-800">Gerenciamento de Usuários</h2>
        <span className="text-gray-600 font-medium text-2xl">{users.length} usuário(s)</span>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="hidden md:table-header-group bg-gray-100">
            <tr>
              <th scope="col" className="px-6 py-5 text-left text-lg font-extrabold text-gray-600 uppercase tracking-wider">E-mail</th>
              <th scope="col" className="px-6 py-5 text-left text-lg font-extrabold text-gray-600 uppercase tracking-wider">Data de Cadastro</th>
              <th scope="col" className="px-6 py-5 text-right text-lg font-extrabold text-gray-600 uppercase tracking-wider">Ações</th>
            </tr>
          </thead>
          <tbody className="bg-transparent md:bg-white md:divide-y md:divide-gray-200">
            {users.length > 0 ? users.map((user) => (
              <tr key={user.email} className="block md:table-row mb-8 md:mb-0 bg-white rounded-xl shadow-md md:shadow-none md:hover:bg-gray-50 transition-colors">
                <td className="p-5 md:px-6 md:py-6 whitespace-nowrap block md:table-cell border-b md:border-b-0">
                    <div className="flex justify-between items-center md:block">
                        <span className="font-bold text-gray-700 md:hidden text-lg">E-mail</span>
                        <span className="text-xl md:text-2xl font-medium text-gray-900 md:text-left text-right">{user.email}</span>
                    </div>
                </td>
                <td className="p-5 md:px-6 md:py-6 whitespace-nowrap block md:table-cell border-b md:border-b-0">
                    <div className="flex justify-between items-center md:block">
                        <span className="font-bold text-gray-700 md:hidden text-lg">Data de Cadastro</span>
                        <span className="text-xl md:text-2xl text-gray-600 md:text-left text-right">
                            {new Date(user.createdAt).toLocaleDateString('pt-BR', {
                                day: '2-digit',
                                month: 'long',
                                year: 'numeric',
                            })}
                        </span>
                    </div>
                </td>
                <td className="p-5 md:px-6 md:py-6 whitespace-nowrap block md:table-cell text-right">
                    <div className="flex justify-end items-center md:block mt-2 md:mt-0">
                        <button 
                            onClick={() => handleDeleteUser(user.email)} 
                            className="p-3 bg-red-100 rounded-full text-red-600 hover:bg-red-200 transition-colors" 
                            title="Excluir Usuário"
                        >
                            <TrashIcon className="w-8 h-8" />
                        </button>
                    </div>
                </td>
              </tr>
            )) : (
                <tr className="block md:table-row">
                    <td colSpan={3} className="text-center py-12 text-gray-500 block text-2xl">
                        Nenhum usuário cadastrado ainda.
                    </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserManagement;
