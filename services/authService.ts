
import type { User } from '../types';

// NOTE: This is a simulation. In a real app, never store passwords in plain text or handle auth client-side.
const USERS_KEY = 'taxi_app_users';
const CURRENT_USER_KEY = 'taxi_app_current_user';

const getStoredUsers = (): Record<string, Omit<User, 'email'> & { passwordHash: string }> => {
  try {
    const users = localStorage.getItem(USERS_KEY);
    return users ? JSON.parse(users) : {};
  } catch (error) {
    return {};
  }
};

const storeUsers = (users: Record<string, Omit<User, 'email'> & { passwordHash: string }>) => {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

export const register = (email: string, password: string): { success: boolean; message: string; user?: User } => {
  const users = getStoredUsers();

  if (email.toLowerCase() === 'admin') {
      return { success: false, message: 'Este nome de usuário é reservado.' };
  }
  
  if (users[email]) {
    return { success: false, message: 'Este e-mail já está cadastrado.' };
  }

  const newUser: User = {
    email,
    role: 'user',
    createdAt: new Date().toISOString(),
  };

  users[email] = {
    ...newUser,
    passwordHash: password, // In a real app, hash the password
  };

  storeUsers(users);
  return { success: true, message: 'Cadastro realizado com sucesso!', user: newUser };
};

export const login = (email: string, password: string): { success: boolean; message: string; user?: User } => {
  // Hardcoded admin login
  if (email.toLowerCase() === 'admin' && password === 'Admin') {
    const adminUser: User = {
      email: 'Admin',
      role: 'admin',
      createdAt: new Date().toISOString(),
    };
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(adminUser));
    return { success: true, message: 'Login de administrador bem-sucedido!', user: adminUser };
  }

  const users = getStoredUsers();
  const storedUser = users[email];

  if (storedUser && storedUser.passwordHash === password) { // In real app, compare hashes
    const user: User = {
        // Fix: The 'storedUser' object does not have an 'email' property. The email is the key, which is available in the 'email' function parameter.
        email: email,
        role: storedUser.role,
        createdAt: storedUser.createdAt
    };
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    return { success: true, message: 'Login bem-sucedido!', user };
  }

  return { success: false, message: 'E-mail ou senha inválidos.' };
};

export const logout = () => {
  localStorage.removeItem(CURRENT_USER_KEY);
};

export const getCurrentUser = (): User | null => {
  try {
    const user = localStorage.getItem(CURRENT_USER_KEY);
    return user ? JSON.parse(user) : null;
  } catch (error) {
    return null;
  }
};

export const getAllUsers = (): User[] => {
    const users = getStoredUsers();
    // Fix: The user object from Object.values() does not have an 'email' property. Use Object.entries() to get both the email (key) and the user data.
    return Object.entries(users).map(([email, u]) => ({
        email: email,
        role: u.role,
        createdAt: u.createdAt,
    }));
};

export const deleteUser = (email: string): boolean => {
    const users = getStoredUsers();
    if (users[email]) {
        delete users[email];
        storeUsers(users);
        return true;
    }
    return false;
};
