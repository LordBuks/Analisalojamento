import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged, User } from 'firebase/auth';
import app from '../firebaseConfig';
import { userService, UserRole } from './userService';
import { adminSetup } from '../utils/adminSetup';

const auth = getAuth(app);

export interface AuthUser {
  uid: string;
  email: string | null;
  role?: 'admin' | 'user';
}

export const authService = {
  // Login com email e senha
  async signIn(email: string, password: string): Promise<AuthUser> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Buscar papel do usuário no Firestore
      let userRole: UserRole | null = null;
      try {
        userRole = await userService.getUserRole(user.uid);
        
        // Se não existe papel definido, verificar se deve ser admin
        if (!userRole) {
          const role = adminSetup.isAdminEmail(user.email || '') ? 'admin' : 'user';
          await userService.setUserRole({
            uid: user.uid,
            email: user.email || '',
            role: role,
            createdAt: new Date(),
            updatedAt: new Date()
          });
          userRole = { uid: user.uid, email: user.email || '', role: role };
        } else {
          // Verificar se precisa atualizar para admin
          await adminSetup.setupAdminIfNeeded(user.uid, user.email || '');
          // Recarregar dados do usuário após possível atualização
          userRole = await userService.getUserRole(user.uid) || userRole;
        }
      } catch (error) {
        console.warn('Erro ao buscar papel do usuário, definindo como user:', error);
        const role = adminSetup.isAdminEmail(user.email || '') ? 'admin' : 'user';
        userRole = { uid: user.uid, email: user.email || '', role: role };
      }
      
      return {
        uid: user.uid,
        email: user.email,
        role: userRole.role
      };
    } catch (error: any) {
      console.error('Erro no login:', error);
      throw new Error(this.getErrorMessage(error.code));
    }
  },

  // Logout
  async signOut(): Promise<void> {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Erro no logout:', error);
      throw error;
    }
  },

  // Observar mudanças no estado de autenticação
  onAuthStateChanged(callback: (user: AuthUser | null) => void): () => void {
    return onAuthStateChanged(auth, async (user: User | null) => {
      if (user) {
        // Buscar papel do usuário
        let userRole: UserRole | null = null;
        try {
          userRole = await userService.getUserRole(user.uid);
          
          // Se não existe, verificar se deve ser admin
          if (!userRole) {
            const role = adminSetup.isAdminEmail(user.email || '') ? 'admin' : 'user';
            await userService.setUserRole({
              uid: user.uid,
              email: user.email || '',
              role: role,
              createdAt: new Date(),
              updatedAt: new Date()
            });
            userRole = { uid: user.uid, email: user.email || '', role: role };
          }
        } catch (error) {
          console.warn('Erro ao buscar papel do usuário:', error);
          const role = adminSetup.isAdminEmail(user.email || '') ? 'admin' : 'user';
          userRole = { uid: user.uid, email: user.email || '', role: role };
        }
        
        callback({
          uid: user.uid,
          email: user.email,
          role: userRole?.role || 'user'
        });
      } else {
        callback(null);
      }
    });
  },

  // Obter usuário atual
  getCurrentUser(): AuthUser | null {
    const user = auth.currentUser;
    if (user) {
      return {
        uid: user.uid,
        email: user.email,
        role: 'user' // Será atualizado pelo onAuthStateChanged
      };
    }
    return null;
  },

  // Traduzir códigos de erro do Firebase
  getErrorMessage(errorCode: string): string {
    switch (errorCode) {
      case 'auth/user-not-found':
        return 'Usuário não encontrado';
      case 'auth/wrong-password':
        return 'Senha incorreta';
      case 'auth/invalid-email':
        return 'Email inválido';
      case 'auth/user-disabled':
        return 'Usuário desabilitado';
      case 'auth/too-many-requests':
        return 'Muitas tentativas. Tente novamente mais tarde';
      case 'auth/network-request-failed':
        return 'Erro de conexão. Verifique sua internet';
      default:
        return 'Erro de autenticação. Tente novamente';
    }
  }
};

