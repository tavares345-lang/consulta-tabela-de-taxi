import { doc, getDoc, setDoc, deleteDoc, getDocs, collection } from 'firebase/firestore';
import { db, auth } from './firebase';
import type { User } from '../types';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid,
      email: auth?.currentUser?.email,
      emailVerified: auth?.currentUser?.emailVerified,
      isAnonymous: auth?.currentUser?.isAnonymous,
      tenantId: auth?.currentUser?.tenantId,
      providerInfo: auth?.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

const CURRENT_USER_KEY = 'taxi_app_current_user';

export const register = async (
  email: string, 
  password: string, 
  role: 'user' | 'admin' = 'user'
): Promise<{ success: boolean; message: string; user?: User }> => {
  const normalizedEmail = email.trim().toLowerCase();

  if (normalizedEmail === 'admin') {
    return { success: false, message: 'Este nome de usuário é reservado.' };
  }

  try {
    const userDocRef = doc(db, 'users', normalizedEmail);
    let userDoc;
    try {
      userDoc = await getDoc(userDocRef);
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, 'users/' + normalizedEmail);
      return { success: false, message: 'Erro ao verificar usuário existente.' };
    }
    
    if (userDoc.exists()) {
      return { success: false, message: 'Este e-mail ou usuário já está cadastrado.' };
    }

    const newUser: User = {
      email,
      role,
      createdAt: new Date().toISOString()
    };

    try {
      await setDoc(userDocRef, {
        email,
        role,
        passwordHash: password,
        createdAt: newUser.createdAt
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'users/' + normalizedEmail);
      return { success: false, message: 'Erro ao gravar usuário.' };
    }

    return { success: true, message: 'Cadastro realizado com sucesso!', user: newUser };
  } catch (error) {
    return { success: false, message: 'Erro ao realizar cadastro.' };
  }
};

export const login = async (
  email: string, 
  password: string
): Promise<{ success: boolean; message: string; user?: User }> => {
  const normalizedEmail = email.trim().toLowerCase();

  // Hardcoded recovery or initial admin setup fallback
  if (normalizedEmail === 'admin' && password === 'Admin') {
    const adminUser: User = {
      email: 'Admin',
      role: 'admin',
      createdAt: new Date().toISOString(),
    };
    
    // Automatically provision or sync admin in Firestore
    try {
      const adminDocRef = doc(db, 'users', 'admin');
      const adminDoc = await getDoc(adminDocRef);
      if (!adminDoc.exists()) {
        await setDoc(adminDocRef, {
          email: 'admin',
          role: 'admin',
          passwordHash: 'Admin',
          createdAt: adminUser.createdAt
        });
      }
    } catch (e) {
      console.warn("Could not auto-provision admin: ", e);
    }

    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(adminUser));
    return { success: true, message: 'Login de administrador bem-sucedido!', user: adminUser };
  }

  try {
    const userDocRef = doc(db, 'users', normalizedEmail);
    let userDoc;
    try {
      userDoc = await getDoc(userDocRef);
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, 'users/' + normalizedEmail);
      return { success: false, message: 'Erro ao consultar usuário no banco de dados.' };
    }

    if (userDoc.exists()) {
      const stored = userDoc.data();
      if (stored.passwordHash === password) {
        const user: User = {
          email: stored.email || userDoc.id,
          role: stored.role || 'user',
          createdAt: stored.createdAt || new Date().toISOString()
        };
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
        return { success: true, message: 'Login bem-sucedido!', user };
      }
    }

    return { success: false, message: 'E-mail ou senha inválidos.' };
  } catch (err) {
    return { success: false, message: 'Erro de conexão ao realizar login.' };
  }
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

export const getAllUsers = async (): Promise<User[]> => {
  const usersCollection = collection(db, 'users');
  try {
    const snapshot = await getDocs(usersCollection);
    const usersList: User[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      usersList.push({
        email: data.email || doc.id,
        role: data.role || 'user',
        createdAt: data.createdAt || new Date().toISOString()
      });
    });
    return usersList;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'users');
    return [];
  }
};

export const deleteUser = async (email: string): Promise<boolean> => {
  const normalizedEmail = email.trim().toLowerCase();
  try {
    const userDocRef = doc(db, 'users', normalizedEmail);
    await deleteDoc(userDocRef);
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, 'users/' + normalizedEmail);
    return false;
  }
};
