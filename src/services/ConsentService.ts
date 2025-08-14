// Serviço para gerenciar consentimentos LGPD
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  query, 
  where, 
  getDocs, 
  Timestamp 
} from 'firebase/firestore';
import { db } from "../lib/firebase"; // Ajuste o caminho conforme sua estrutura

export interface ConsentRecord {
  id?: string;
  userEmail: string;
  userId: string;
  consented: boolean;
  timestamp: Timestamp;
  ipAddress?: string;
  userAgent?: string;
  documentVersion: string;
  sessionId?: string;
}

export class ConsentService {
  private static readonly COLLECTION_NAME = 'lgpd_consents';
  private static readonly CURRENT_DOCUMENT_VERSION = '1.0';

  /**
   * Registra o consentimento do usuário
   */
  static async recordConsent(
    userEmail: string,
    userId: string,
    consented: boolean,
    additionalData?: {
      ipAddress?: string;
      userAgent?: string;
      sessionId?: string;
    }
  ): Promise<void> {
    try {
      const consentRecord: ConsentRecord = {
        userEmail,
        userId,
        consented,
        timestamp: Timestamp.now(),
        documentVersion: this.CURRENT_DOCUMENT_VERSION,
        ...additionalData
      };

      // Usar o userId como ID do documento para facilitar consultas
      const docRef = doc(db, this.COLLECTION_NAME, `${userId}_${Date.now()}`);
      await setDoc(docRef, consentRecord);

      console.log('Consentimento registrado com sucesso:', consentRecord);
    } catch (error) {
      console.error('Erro ao registrar consentimento:', error);
      throw new Error('Falha ao registrar consentimento');
    }
  }

  /**
   * Verifica se o usuário já deu consentimento válido
   */
  static async hasValidConsent(userId: string): Promise<boolean> {
    try {
      const q = query(
        collection(db, this.COLLECTION_NAME),
        where('userId', '==', userId),
        where('consented', '==', true),
        where('documentVersion', '==', this.CURRENT_DOCUMENT_VERSION)
      );

      const querySnapshot = await getDocs(q);
      return !querySnapshot.empty;
    } catch (error) {
      console.error('Erro ao verificar consentimento:', error);
      return false;
    }
  }

  /**
   * Obtém o último consentimento do usuário
   */
  static async getLastConsent(userId: string): Promise<ConsentRecord | null> {
    try {
      const q = query(
        collection(db, this.COLLECTION_NAME),
        where('userId', '==', userId)
      );

      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return null;
      }

      // Ordenar por timestamp e pegar o mais recente
      const consents = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as ConsentRecord));

      consents.sort((a, b) => b.timestamp.toMillis() - a.timestamp.toMillis());
      
      return consents[0];
    } catch (error) {
      console.error('Erro ao obter último consentimento:', error);
      return null;
    }
  }

  /**
   * Obtém todos os consentimentos de um usuário (para auditoria)
   */
  static async getUserConsentHistory(userId: string): Promise<ConsentRecord[]> {
    try {
      const q = query(
        collection(db, this.COLLECTION_NAME),
        where('userId', '==', userId)
      );

      const querySnapshot = await getDocs(q);
      
      const consents = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as ConsentRecord));

      // Ordenar por timestamp (mais recente primeiro)
      consents.sort((a, b) => b.timestamp.toMillis() - a.timestamp.toMillis());
      
      return consents;
    } catch (error) {
      console.error('Erro ao obter histórico de consentimentos:', error);
      return [];
    }
  }

  /**
   * Revoga o consentimento do usuário
   */
  static async revokeConsent(
    userEmail: string,
    userId: string,
    additionalData?: {
      ipAddress?: string;
      userAgent?: string;
      sessionId?: string;
    }
  ): Promise<void> {
    try {
      await this.recordConsent(userEmail, userId, false, additionalData);
      console.log('Consentimento revogado com sucesso');
    } catch (error) {
      console.error('Erro ao revogar consentimento:', error);
      throw new Error('Falha ao revogar consentimento');
    }
  }

  /**
   * Verifica se é necessário solicitar novo consentimento
   * (por exemplo, se a versão do documento mudou)
   */
  static async needsNewConsent(userId: string): Promise<boolean> {
    try {
      const lastConsent = await this.getLastConsent(userId);
      
      if (!lastConsent) {
        return true; // Nunca deu consentimento
      }

      if (!lastConsent.consented) {
        return true; // Último consentimento foi negativo
      }

      if (lastConsent.documentVersion !== this.CURRENT_DOCUMENT_VERSION) {
        return true; // Versão do documento mudou
      }

      return false;
    } catch (error) {
      console.error('Erro ao verificar necessidade de novo consentimento:', error);
      return true; // Em caso de erro, solicitar consentimento por segurança
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
      onLine: navigator.onLine
    };
  }

  /**
   * Gera um ID de sessão único
   */
  static generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Hook React para usar o serviço de consentimento
import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth'; // Ajuste o caminho conforme sua estrutura

export const useConsentManager = () => {
  const [needsConsent, setNeedsConsent] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { user } = useAuth();

  useEffect(() => {
    const checkConsentStatus = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        const needs = await ConsentService.needsNewConsent(user.uid);
        setNeedsConsent(needs);
      } catch (error) {
        console.error('Erro ao verificar status do consentimento:', error);
        setNeedsConsent(true); // Em caso de erro, solicitar consentimento
      } finally {
        setIsLoading(false);
      }
    };

    checkConsentStatus();
  }, [user]);

  const recordConsent = async (consented: boolean) => {
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    const browserInfo = ConsentService.getBrowserInfo();
    const sessionId = ConsentService.generateSessionId();

    await ConsentService.recordConsent(
      user.email || '',
      user.uid,
      consented,
      {
        userAgent: browserInfo.userAgent,
        sessionId
      }
    );

    setNeedsConsent(false);
  };

  return {
    needsConsent,
    isLoading,
    recordConsent
  };
};

