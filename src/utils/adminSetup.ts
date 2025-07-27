import { userService } from '../services/userService';

// Lista de emails que devem ser administradores
const ADMIN_EMAILS = [
  'admin@inter.com',
  // Adicione outros emails de administradores aqui
];

export const adminSetup = {
  // Verificar se um email deve ser administrador
  isAdminEmail(email: string): boolean {
    return ADMIN_EMAILS.includes(email.toLowerCase());
  },

  // Configurar usuário como administrador se o email estiver na lista
  async setupAdminIfNeeded(uid: string, email: string): Promise<void> {
    try {
      if (this.isAdminEmail(email)) {
        const existingUser = await userService.getUserRole(uid);
        
        // Se o usuário não existe ou não é admin, configurar como admin
        if (!existingUser || existingUser.role !== 'admin') {
          await userService.setUserRole({
            uid,
            email,
            role: 'admin',
            createdAt: existingUser?.createdAt || new Date(),
            updatedAt: new Date()
          });
          
          console.log(`Usuário ${email} configurado como administrador`);
        }
      }
    } catch (error) {
      console.error('Erro ao configurar administrador:', error);
    }
  }
};

