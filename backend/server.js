const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');
const admin = require('firebase-admin');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Configuração do Firebase Admin SDK
let firebaseInitialized = false;
try {
  // Configuração usando variáveis de ambiente
  if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
    const serviceAccount = {
      type: "service_account",
      project_id: process.env.FIREBASE_PROJECT_ID,
      private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
      private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      client_id: process.env.FIREBASE_CLIENT_ID,
      auth_uri: "https://accounts.google.com/o/oauth2/auth",
      token_uri: "https://oauth2.googleapis.com/token",
      auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
      client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${process.env.FIREBASE_CLIENT_EMAIL}`
    };

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: process.env.FIREBASE_PROJECT_ID
    });
    
    firebaseInitialized = true;
    console.log('🔥 Firebase Admin SDK inicializado com sucesso');
  } else {
    console.log('⚠️ Firebase Admin SDK não configurado - variáveis de ambiente ausentes');
    console.log('   Funcionando apenas com backend customizado (sem integração Firebase)');
  }
} catch (error) {
  console.error('❌ Erro ao inicializar Firebase Admin SDK:', error.message);
  console.log('   Funcionando apenas com backend customizado (sem integração Firebase)');
}

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

// Armazenamento temporário de tokens (em produção, usar banco de dados)
const resetTokens = new Map();

// Lista de usuários válidos (emails fictícios para autenticação)
const validUsers = new Set([
  'pedagogia@inter.com',
  'admin@inter.com', 
  'teste@inter.com',
  'atleta1@inter.com',
  'atleta2@inter.com',
  'coordenacao@inter.com'
]);

// Rate limiting simples
const rateLimitMap = new Map();
const rateLimit = (req, res, next) => {
  const clientIP = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutos
  const maxRequests = 10;
  
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

// Função para limpar tokens expirados
const cleanExpiredTokens = () => {
  const now = Date.now();
  for (const [token, data] of resetTokens.entries()) {
    if (now > data.expiresAt) {
      resetTokens.delete(token);
      console.log(`🧹 Token expirado removido para: ${data.email}`);
    }
  }
};

// Limpar tokens expirados a cada 5 minutos
setInterval(cleanExpiredTokens, 5 * 60 * 1000);

// Função para buscar UID do usuário no Firebase pelo email
const getUserUidByEmail = async (email) => {
  if (!firebaseInitialized) {
    throw new Error('Firebase Admin SDK não está inicializado');
  }
  
  try {
    const userRecord = await admin.auth().getUserByEmail(email);
    return userRecord.uid;
  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      throw new Error(`Usuário com email ${email} não encontrado no Firebase`);
    }
    throw error;
  }
};

// Função para atualizar senha no Firebase
const updateFirebasePassword = async (email, newPassword) => {
  if (!firebaseInitialized) {
    console.log('⚠️ Firebase não configurado - senha não será atualizada no Firebase');
    return false;
  }
  
  try {
    const uid = await getUserUidByEmail(email);
    
    await admin.auth().updateUser(uid, {
      password: newPassword
    });
    
    console.log(`🔥 Senha atualizada no Firebase para: ${email} (UID: ${uid})`);
    return true;
  } catch (error) {
    console.error(`❌ Erro ao atualizar senha no Firebase para ${email}:`, error.message);
    console.error(`   Detalhes do erro do Firebase:`, error.code, error.stack);
    throw error;
  }
};

// Endpoint principal - gerar link de redefinição (compatível com a interface atual)
app.post('/generate-reset-link', rateLimit, async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ 
        error: 'Email é obrigatório',
        code: 'MISSING_EMAIL' 
      });
    }
    
    // Validar formato do email
    const emailRegex = /^[^
@]+@[^
@]+\.[^
@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        error: 'Formato de email inválido',
        code: 'INVALID_EMAIL_FORMAT' 
      });
    }
    
    console.log(`🔄 Gerando link customizado para: ${email}`);
    
    // Verificar se usuário existe na lista de usuários válidos
    if (!validUsers.has(email)) {
      return res.status(404).json({ 
        error: 'Usuário não encontrado',
        code: 'USER_NOT_FOUND' 
      });
    }
    
    // Invalidar tokens anteriores para este email
    for (const [token, data] of resetTokens.entries()) {
      if (data.email === email) {
        resetTokens.delete(token);
        console.log(`🗑️ Token anterior invalidado para: ${email}`);
      }
    }
    
    // Gerar token único
    const token = uuidv4();
    const expiresAt = Date.now() + (60 * 60 * 1000); // 1 hora
    
    // Armazenar token
    resetTokens.set(token, {
      email: email,
      expiresAt: expiresAt,
      used: false,
      createdAt: Date.now()
    });
    
    // Gerar link de redefinição customizado
    const resetLink = `https://analisalojamento.vercel.app/reset-password?token=${token}`;
    
    console.log(`✅ Link customizado gerado para: ${email}`);
    console.log(`🔗 Token: ${token.substring(0, 8)}...`);
    
    // Resposta compatível com a interface atual
    res.json({
      success: true,
      resetLink: resetLink,
      email: email,
      message: 'Link gerado com sucesso'
    });
    
  } catch (error) {
    console.error('❌ Erro:', error);
    
    res.status(500).json({
      error: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Endpoint para validar token e obter informações do usuário
app.get('/validate-token/:token', async (req, res) => {
  try {
    const { token } = req.params;
    
    if (!token) {
      return res.status(400).json({
        error: 'Token é obrigatório',
        code: 'MISSING_TOKEN'
      });
    }
    
    const tokenData = resetTokens.get(token);
    
    if (!tokenData) {
      return res.status(404).json({
        error: 'Token não encontrado ou inválido',
        code: 'TOKEN_NOT_FOUND'
      });
    }
    
    if (Date.now() > tokenData.expiresAt) {
      resetTokens.delete(token);
      return res.status(410).json({
        error: 'Token expirado',
        code: 'TOKEN_EXPIRED'
      });
    }
    
    if (tokenData.used) {
      return res.status(410).json({
        error: 'Token já utilizado',
        code: 'TOKEN_USED'
      });
    }
    
    console.log(`✅ Token válido para: ${tokenData.email}`);
    
    res.json({
      success: true,
      email: tokenData.email,
      message: 'Token válido'
    });
    
  } catch (error) {
    console.error('❌ Erro ao validar token:', error);
    
    res.status(500).json({
      error: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Endpoint para redefinir senha
app.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    
    if (!token || !password) {
      return res.status(400).json({
        error: 'Token e senha são obrigatórios',
        code: 'MISSING_FIELDS'
      });
    }
    
    // Validar senha
    if (password.length < 6) {
      return res.status(400).json({
        error: 'A senha deve ter pelo menos 6 caracteres',
        code: 'WEAK_PASSWORD'
      });
    }
    
    if (!/(?=.*[a-zA-Z])/.test(password)) {
      return res.status(400).json({
        error: 'A senha deve conter pelo menos uma letra',
        code: 'WEAK_PASSWORD'
      });
    }
    
    const tokenData = resetTokens.get(token);
    
    if (!tokenData) {
      return res.status(404).json({
        error: 'Token não encontrado',
        code: 'TOKEN_NOT_FOUND'
      });
    }
    
    if (Date.now() > tokenData.expiresAt) {
      resetTokens.delete(token);
      return res.status(410).json({
        error: 'Token expirado',
        code: 'TOKEN_EXPIRED'
      });
    }
    
    if (tokenData.used) {
      return res.status(410).json({
        error: 'Token já utilizado',
        code: 'TOKEN_USED'
      });
    }
    
    // Hash da senha (para demonstração - em produção salvar no banco)
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Tentar atualizar senha no Firebase
    let firebaseUpdated = false;
    let firebaseError = null;
    
    try {
      firebaseUpdated = await updateFirebasePassword(tokenData.email, password);
    } catch (error) {
      firebaseError = error.message;
      console.error(`⚠️ Falha ao atualizar no Firebase: ${error.message}`);
    }
    
    // Marcar token como usado
    tokenData.used = true;
    tokenData.usedAt = Date.now();
    tokenData.firebaseUpdated = firebaseUpdated;
    tokenData.firebaseError = firebaseError;
    resetTokens.set(token, tokenData);
    
    console.log(`✅ Senha redefinida com sucesso para: ${tokenData.email}`);
    console.log(`🔒 Hash da senha: ${hashedPassword.substring(0, 20)}...`);
    
    if (firebaseUpdated) {
      console.log(`🔥 Senha também atualizada no Firebase Authentication`);
    } else {
      console.log(`⚠️ Senha NÃO foi atualizada no Firebase: ${firebaseError || 'Firebase não configurado'}`);
    }
    
    res.json({
      success: true,
      email: tokenData.email,
      message: 'Senha redefinida com sucesso',
      firebaseUpdated: firebaseUpdated,
      firebaseError: firebaseError
    });
    
  } catch (error) {
    console.error('❌ Erro ao redefinir senha:', error);
    
    res.status(500).json({
      error: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'Custom Password Reset Backend',
    activeTokens: resetTokens.size,
    validUsers: validUsers.size,
    firebaseInitialized: firebaseInitialized,
    firebaseProjectId: process.env.FIREBASE_PROJECT_ID || 'não configurado'
  });
});

// Endpoint para listar usuários válidos (para debug)
app.get('/users', (req, res) => {
  res.json({
    validUsers: Array.from(validUsers),
    totalUsers: validUsers.size
  });
});

// Endpoint para debug de tokens (remover em produção)
app.get('/debug/tokens', (req, res) => {
  const tokenList = [];
  for (const [token, data] of resetTokens.entries()) {
    tokenList.push({
      token: token.substring(0, 8) + '...',
      email: data.email,
      createdAt: new Date(data.createdAt).toISOString(),
      expiresAt: new Date(data.expiresAt).toISOString(),
      used: data.used,
      usedAt: data.usedAt ? new Date(data.usedAt).toISOString() : null,
      firebaseUpdated: data.firebaseUpdated || false,
      firebaseError: data.firebaseError || null
    });
  }
  res.json({ 
    tokens: tokenList,
    total: tokenList.length,
    firebaseInitialized: firebaseInitialized
  });
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Backend customizado rodando na porta ${PORT}`);
  console.log(`🔗 Health: http://localhost:${PORT}/health`);
  console.log(`👥 Usuários válidos: ${Array.from(validUsers).join(', ')}`);
  console.log(`🔥 Firebase Admin SDK: ${firebaseInitialized ? 'ATIVO' : 'INATIVO'}`);
  if (firebaseInitialized) {
    console.log(`📋 Projeto Firebase: ${process.env.FIREBASE_PROJECT_ID}`);
  }
  console.log(`📝 Endpoints disponíveis:`);
  console.log(`   POST /generate-reset-link - Gerar link de redefinição`);
  console.log(`   GET  /validate-token/:token - Validar token`);
  console.log(`   POST /reset-password - Redefinir senha (+ Firebase)`);
  console.log(`   GET  /health - Status do servidor`);
  console.log(`   GET  /users - Listar usuários válidos`);
});

module.exports = app;



