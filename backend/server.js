const express = require('express');
const admin = require('firebase-admin');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: [
    'https://analisalojamento.vercel.app',
    'https://dashboard-disciplinar-atletas.vercel.app',
    'http://localhost:3000',
    'http://localhost:5173',
    'https://localhost:3000',
    'https://localhost:5173'
  ],
  credentials: true
}));
app.use(express.json());

// Inicializar Firebase Admin SDK
let firebaseInitialized = false;

const initializeFirebase = () => {
  if (!firebaseInitialized) {
    try {
      if (admin.apps.length === 0) {
        // Tentar carregar de variável de ambiente primeiro
        let serviceAccount;
        
        if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
          try {
            serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
            console.log('✅ Carregando credenciais do Firebase de variável de ambiente');
          } catch (parseError) {
            console.error('❌ Erro ao parsear FIREBASE_SERVICE_ACCOUNT_JSON:', parseError);
            throw parseError;
          }
        } else {
          // Fallback para arquivo local (desenvolvimento)
          try {
            serviceAccount = require('./serviceAccountKey.json');
            console.log('✅ Carregando credenciais do Firebase de arquivo local');
          } catch (fileError) {
            console.error('❌ Erro ao carregar serviceAccountKey.json:', fileError);
            throw new Error('Credenciais do Firebase não encontradas. Configure FIREBASE_SERVICE_ACCOUNT_JSON ou adicione serviceAccountKey.json');
          }
        }
        
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
      }
      firebaseInitialized = true;
      console.log('✅ Firebase Admin SDK inicializado');
    } catch (error) {
      console.error('❌ Erro ao inicializar Firebase:', error);
      throw error;
    }
  }
};

// Rate limiting simples
const rateLimitMap = new Map();
const rateLimit = (req, res, next) => {
  const clientIP = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutos
  const maxRequests = 5;
  
  if (!rateLimitMap.has(clientIP)) {
    rateLimitMap.set(clientIP, { count: 1, resetTime: now + windowMs });
    return next();
  }
  
  const clientData = rateLimitMap.get(clientIP);
  
  if (now > clientData.resetTime) {
    rateLimitMap.set(clientIP, { count: 1, resetTime: now + windowMs });
    return next();
  }
  
  if (clientData.count >= maxRequests) {
    return res.status(429).json({
      error: 'Muitas tentativas. Tente novamente em 15 minutos.',
      code: 'RATE_LIMIT_EXCEEDED'
    });
  }
  
  clientData.count++;
  next();
};

// Endpoint principal - gerar link de redefinição
app.post('/generate-reset-link', rateLimit, async (req, res) => {
  try {
    initializeFirebase();
    
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ 
        error: 'Email é obrigatório',
        code: 'MISSING_EMAIL' 
      });
    }
    
    // Validar formato do email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        error: 'Formato de email inválido',
        code: 'INVALID_EMAIL_FORMAT' 
      });
    }
    
    console.log(`🔄 Gerando link para: ${email}`);
    
    // Verificar se usuário existe
    let userExists = false;
    try {
      await admin.auth().getUserByEmail(email);
      userExists = true;
    } catch (error) {
      if (error.code !== 'auth/user-not-found') {
        throw error;
      }
    }
    
    if (!userExists) {
      return res.status(404).json({ 
        error: 'Usuário não encontrado',
        code: 'USER_NOT_FOUND' 
      });
    }
    
    // Gerar link de redefinição
    const actionCodeSettings = {
      url: 'https://analisalojamento.vercel.app/login',
      handleCodeInApp: false,
    };
    
    const resetLink = await admin.auth().generatePasswordResetLink(email, actionCodeSettings);
    
    console.log(`✅ Link gerado para: ${email}`);
    
    res.json({
      success: true,
      resetLink: resetLink,
      email: email,
      message: 'Link gerado com sucesso'
    });
    
  } catch (error) {
    console.error('❌ Erro:', error);
    
    let errorMessage = 'Erro interno do servidor';
    let errorCode = 'INTERNAL_ERROR';
    
    if (error.code === 'auth/user-not-found') {
      errorMessage = 'Usuário não encontrado';
      errorCode = 'USER_NOT_FOUND';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Email inválido';
      errorCode = 'INVALID_EMAIL';
    }
    
    res.status(500).json({
      error: errorMessage,
      code: errorCode
    });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'Analisalojamento Reset Password Backend'
  });
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Backend rodando na porta ${PORT}`);
  console.log(`🔗 Health: http://localhost:${PORT}/health`);
});

module.exports = app;

