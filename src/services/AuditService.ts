// Serviço de Auditoria para Sistema Analisalojamento
// Registra todos os acessos a dados sensíveis para compliance LGPD

import { 
  collection, 
  doc, 
  setDoc, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  limit,
  Timestamp 
} from 'firebase/firestore';
import { db } from "../lib/firebase"; // Ajuste o caminho conforme sua estrutura

export interface AuditLog {
  id?: string;
  userId: string;
  userEmail: string;
  userRole: string;
  action: string;
  resourceType: string;
  resourceId: string;
  resourceData?: any;
  timestamp: Timestamp;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  success: boolean;
  errorMessage?: string;
  additionalData?: Record<string, any>;
}

export class AuditService {
  private static readonly COLLECTION_NAME = 'audit_logs';

  /**
   * Registra uma ação de auditoria
   */
  static async logAction(
    userId: string,
    userEmail: string,
    userRole: string,
    action: string,
    resourceType: string,
    resourceId: string,
    success: boolean = true,
    additionalData?: {
      resourceData?: any;
      ipAddress?: string;
      userAgent?: string;
      sessionId?: string;
      errorMessage?: string;
      [key: string]: any;
    }
  ): Promise<void> {
    try {
      const auditLog: AuditLog = {
        userId,
        userEmail,
        userRole,
        action,
        resourceType,
        resourceId,
        timestamp: Timestamp.now(),
        success,
        ...additionalData
      };

      // Gerar ID único para o log
      const logId = `${userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const docRef = doc(db, this.COLLECTION_NAME, logId);
      
      await setDoc(docRef, auditLog);

      // Log local para debug (remover em produção)
      console.log('Audit log registrado:', auditLog);
    } catch (error) {
      console.error('Erro ao registrar audit log:', error);
      // Não lançar erro para não interromper o fluxo principal
    }
  }

  /**
   * Registra acesso a dados de atleta
   */
  static async logAthleteAccess(
    userId: string,
    userEmail: string,
    userRole: string,
    atletaId: string,
    action: 'view' | 'edit' | 'create' | 'delete',
    atletaData?: any,
    additionalData?: Record<string, any>
  ): Promise<void> {
    await this.logAction(
      userId,
      userEmail,
      userRole,
      `athlete_${action}`,
      'athlete',
      atletaId,
      true,
      {
        resourceData: atletaData,
        ...additionalData
      }
    );
  }

  /**
   * Registra acesso a ocorrências
   */
  static async logOccurrenceAccess(
    userId: string,
    userEmail: string,
    userRole: string,
    ocorrenciaId: string,
    action: 'view' | 'edit' | 'create' | 'delete',
    ocorrenciaData?: any,
    additionalData?: Record<string, any>
  ): Promise<void> {
    await this.logAction(
      userId,
      userEmail,
      userRole,
      `occurrence_${action}`,
      'occurrence',
      ocorrenciaId,
      true,
      {
        resourceData: ocorrenciaData,
        ...additionalData
      }
    );
  }

  /**
   * Registra geração/acesso a relatórios
   */
  static async logReportAccess(
    userId: string,
    userEmail: string,
    userRole: string,
    relatorioId: string,
    action: 'generate' | 'view' | 'print' | 'export',
    relatorioData?: any,
    additionalData?: Record<string, any>
  ): Promise<void> {
    await this.logAction(
      userId,
      userEmail,
      userRole,
      `report_${action}`,
      'report',
      relatorioId,
      true,
      {
        resourceData: relatorioData,
        ...additionalData
      }
    );
  }

  /**
   * Registra tentativas de acesso não autorizado
   */
  static async logUnauthorizedAccess(
    userId: string,
    userEmail: string,
    userRole: string,
    attemptedAction: string,
    resourceType: string,
    resourceId: string,
    errorMessage: string,
    additionalData?: Record<string, any>
  ): Promise<void> {
    await this.logAction(
      userId,
      userEmail,
      userRole,
      `unauthorized_${attemptedAction}`,
      resourceType,
      resourceId,
      false,
      {
        errorMessage,
        ...additionalData
      }
    );
  }

  /**
   * Registra login/logout
   */
  static async logAuthAction(
    userId: string,
    userEmail: string,
    userRole: string,
    action: 'login' | 'logout' | 'failed_login',
    success: boolean = true,
    errorMessage?: string,
    additionalData?: Record<string, any>
  ): Promise<void> {
    await this.logAction(
      userId,
      userEmail,
      userRole,
      action,
      'auth',
      userId,
      success,
      {
        errorMessage,
        ...additionalData
      }
    );
  }

  /**
   * Obtém logs de auditoria por usuário
   */
  static async getUserAuditLogs(
    userId: string,
    limitCount: number = 100
  ): Promise<AuditLog[]> {
    try {
      const q = query(
        collection(db, this.COLLECTION_NAME),
        where('userId', '==', userId),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as AuditLog));
    } catch (error) {
      console.error('Erro ao obter logs de auditoria do usuário:', error);
      return [];
    }
  }

  /**
   * Obtém logs de auditoria por recurso
   */
  static async getResourceAuditLogs(
    resourceType: string,
    resourceId: string,
    limitCount: number = 100
  ): Promise<AuditLog[]> {
    try {
      const q = query(
        collection(db, this.COLLECTION_NAME),
        where('resourceType', '==', resourceType),
        where('resourceId', '==', resourceId),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as AuditLog));
    } catch (error) {
      console.error('Erro ao obter logs de auditoria do recurso:', error);
      return [];
    }
  }

  /**
   * Obtém logs de auditoria por ação
   */
  static async getActionAuditLogs(
    action: string,
    limitCount: number = 100
  ): Promise<AuditLog[]> {
    try {
      const q = query(
        collection(db, this.COLLECTION_NAME),
        where('action', '==', action),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as AuditLog));
    } catch (error) {
      console.error('Erro ao obter logs de auditoria por ação:', error);
      return [];
    }
  }

  /**
   * Obtém estatísticas de auditoria
   */
  static async getAuditStats(
    startDate?: Date,
    endDate?: Date
  ): Promise<{
    totalActions: number;
    successfulActions: number;
    failedActions: number;
    uniqueUsers: number;
    actionsByType: Record<string, number>;
    resourcesByType: Record<string, number>;
  }> {
    try {
      // Esta é uma implementação simplificada
      // Em produção, considere usar Cloud Functions para agregações complexas
      
      let q = query(collection(db, this.COLLECTION_NAME));
      
      if (startDate) {
        q = query(q, where('timestamp', '>=', Timestamp.fromDate(startDate)));
      }
      
      if (endDate) {
        q = query(q, where('timestamp', '<=', Timestamp.fromDate(endDate)));
      }

      const querySnapshot = await getDocs(q);
      const logs = querySnapshot.docs.map(doc => doc.data() as AuditLog);

      const stats = {
        totalActions: logs.length,
        successfulActions: logs.filter(log => log.success).length,
        failedActions: logs.filter(log => !log.success).length,
        uniqueUsers: new Set(logs.map(log => log.userId)).size,
        actionsByType: {} as Record<string, number>,
        resourcesByType: {} as Record<string, number>
      };

      // Contar ações por tipo
      logs.forEach(log => {
        stats.actionsByType[log.action] = (stats.actionsByType[log.action] || 0) + 1;
        stats.resourcesByType[log.resourceType] = (stats.resourcesByType[log.resourceType] || 0) + 1;
      });

      return stats;
    } catch (error) {
      console.error('Erro ao obter estatísticas de auditoria:', error);
      return {
        totalActions: 0,
        successfulActions: 0,
        failedActions: 0,
        uniqueUsers: 0,
        actionsByType: {},
        resourcesByType: {}
      };
    }
  }

  /**
   * Obtém informações do navegador para auditoria
   */
  static getBrowserInfo() {
    return {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      screen: {
        width: screen.width,
        height: screen.height,
        colorDepth: screen.colorDepth
      },
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };
  }

  /**
   * Gera um ID de sessão único
   */
  static generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Hook React para usar o serviço de auditoria
import { useAuth } from '../hooks/useAuth'; // Ajuste o caminho conforme sua estrutura

export const useAuditLogger = () => {
  const { user } = useAuth();

  const logAction = async (
    action: string,
    resourceType: string,
    resourceId: string,
    success: boolean = true,
    additionalData?: Record<string, any>
  ) => {
    if (!user) {
      console.warn('Tentativa de log de auditoria sem usuário autenticado');
      return;
    }

    const browserInfo = AuditService.getBrowserInfo();
    
    await AuditService.logAction(
      user.uid,
      user.email || '',
      user.role || 'unknown',
      action,
      resourceType,
      resourceId,
      success,
      {
        userAgent: browserInfo.userAgent,
        timezone: browserInfo.timezone,
        ...additionalData
      }
    );
  };

  const logAthleteAccess = async (
    atletaId: string,
    action: 'view' | 'edit' | 'create' | 'delete',
    atletaData?: any
  ) => {
    if (!user) return;

    await AuditService.logAthleteAccess(
      user.uid,
      user.email || '',
      user.role || 'unknown',
      atletaId,
      action,
      atletaData,
      AuditService.getBrowserInfo()
    );
  };

  const logReportAccess = async (
    relatorioId: string,
    action: 'generate' | 'view' | 'print' | 'export',
    relatorioData?: any
  ) => {
    if (!user) return;

    await AuditService.logReportAccess(
      user.uid,
      user.email || '',
      user.role || 'unknown',
      relatorioId,
      action,
      relatorioData,
      AuditService.getBrowserInfo()
    );
  };

  return {
    logAction,
    logAthleteAccess,
    logReportAccess
  };
};

