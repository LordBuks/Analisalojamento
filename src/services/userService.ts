import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import app from '../firebaseConfig';

const db = getFirestore(app);

export interface UserRole {
  uid: string;
  email: string;
  role: 'admin' | 'user';
  createdAt?: Date;
  updatedAt?: Date;
}

export const userService = {
  // Buscar papel do usuário
  async getUserRole(uid: string): Promise<UserRole | null> {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      
      if (userDoc.exists()) {
        return userDoc.data() as UserRole;
      }
      
      return null;
    } catch (error) {
      console.error('Erro ao buscar papel do usuário:', error);
      throw error;
    }
  },

  // Criar ou atualizar papel do usuário
  async setUserRole(userRole: UserRole): Promise<void> {
    try {
      await setDoc(doc(db, 'users', userRole.uid), {
        ...userRole,
        updatedAt: new Date()
      }, { merge: true });
    } catch (error) {
      console.error('Erro ao definir papel do usuário:', error);
      throw error;
    }
  },

  // Verificar se o usuário é administrador
  async isAdmin(uid: string): Promise<boolean> {
    try {
      const userRole = await this.getUserRole(uid);
      return userRole?.role === 'admin';
    } catch (error) {
      console.error('Erro ao verificar se usuário é admin:', error);
      return false;
    }
  },

  // Criar usuário administrador padrão (para setup inicial)
  async createDefaultAdmin(uid: string, email: string): Promise<void> {
    try {
      const existingUser = await this.getUserRole(uid);
      
      if (!existingUser) {
        await this.setUserRole({
          uid,
          email,
          role: 'admin',
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    } catch (error) {
      console.error('Erro ao criar admin padrão:', error);
      throw error;
    }
  }
};

