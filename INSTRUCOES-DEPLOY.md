# 🚀 Instruções de Deploy - Sistema Seguro de Redefinição de Senha

## 📋 Resumo do que foi implementado

Seu projeto agora tem um sistema completo e seguro de redefinição de senha:

### 🔧 Backend Seguro (`/backend/`)
- ✅ Servidor Express que protege a API key do Firebase
- ✅ Rate limiting (máximo 5 tentativas por IP/15min)
- ✅ Validações robustas de email e usuário
- ✅ Logs de segurança

### 🎨 Frontend Integrado (`/src/`)
- ✅ Página administrativa (`/admin/reset-password`)
- ✅ Página de redefinição (`/reset-password`)
- ✅ Serviço de comunicação com backend
- ✅ Design consistente com seu sistema

## 🚀 PASSO A PASSO PARA DEPLOY

### 1. Preparar o Backend

**1.1 Copiar chave do Firebase:**
```bash
# Copie o arquivo serviceAccountKey.json para a pasta backend
cp /caminho/para/serviceAccountKey.json ./backend/serviceAccountKey.json
```

**1.2 Instalar dependências (se ainda não fez):**
```bash
cd backend
npm install
```

**1.3 Testar localmente:**
```bash
cd backend
npm start
# Deve mostrar: 🚀 Backend rodando na porta 3001
```

### 2. Deploy do Backend no Vercel

**2.1 Instalar CLI do Vercel:**
```bash
npm i -g vercel
```

**2.2 Deploy do backend:**
```bash
cd backend
vercel
# Siga as instruções do CLI
```

**2.3 Configurar variáveis no dashboard do Vercel:**
- Acesse [vercel.com/dashboard](https://vercel.com/dashboard)
- Selecione o projeto do backend
- Vá em Settings → Environment Variables
- Adicione:
  - `PORT`: 3001
  - `FRONTEND_URL`: https://analisalojamento.vercel.app

**2.4 Fazer upload da chave do Firebase:**
- No mesmo local, faça upload do arquivo `serviceAccountKey.json`
- Ou copie o conteúdo e cole como variável `FIREBASE_SERVICE_ACCOUNT`

### 3. Configurar Frontend

**3.1 Atualizar variável de ambiente:**
```bash
# Edite o arquivo .env.local
VITE_RESET_PASSWORD_BACKEND_URL=https://seu-backend.vercel.app
```

**3.2 Deploy do frontend:**
```bash
# Na raiz do projeto
git add .
git commit -m "feat: sistema seguro de redefinição de senha"
git push origin main
```

O Vercel fará o deploy automaticamente.

### 4. Configurar Segurança no Firebase

**4.1 Domínios autorizados:**
- Firebase Console → Authentication → Settings → Authorized domains
- Adicionar: `seu-backend.vercel.app`

**4.2 Restrições da API key:**
- Google Cloud Console → APIs & Services → Credentials
- Configurar restrições HTTP referrers:
  - `https://analisalojamento.vercel.app/*`
  - `https://seu-backend.vercel.app/*`

## 🧪 Como Testar

### 1. Teste o backend:
```bash
curl https://seu-backend.vercel.app/health
```

### 2. Teste o sistema completo:
1. Acesse: `https://analisalojamento.vercel.app/admin/reset-password`
2. Digite um email válido
3. Clique em "Gerar Link"
4. Teste o link gerado

## 🔄 Como Usar em Produção

### Para Administradores:
1. **Acesse:** `https://analisalojamento.vercel.app/admin/reset-password`
2. **Digite o email** do usuário
3. **Clique em "Gerar Link"**
4. **Use o botão WhatsApp** ou copie o link
5. **Envie para o usuário**

### Para Usuários:
1. **Recebe o link** via WhatsApp
2. **Clica no link**
3. **Define nova senha**
4. **É redirecionado** para login

## 🛡️ Benefícios de Segurança

- ✅ **API Key protegida** - Nunca exposta no frontend
- ✅ **Rate limiting** - Previne ataques
- ✅ **Validações** - Email, formato, existência
- ✅ **Logs** - Monitoramento completo
- ✅ **LGPD** - Usuário define própria senha

## 🆘 Troubleshooting

### Backend não inicia:
- Verifique se `serviceAccountKey.json` está na pasta `backend/`
- Confirme as variáveis de ambiente

### CORS Error:
- Verifique se o domínio do frontend está na configuração CORS
- Confirme se está usando HTTPS em produção

### Link não funciona:
- Verifique se o usuário existe no Firebase
- Confirme se os domínios estão autorizados
- Teste se o link não expirou (1 hora)

## 🎉 Resultado Final

Após o deploy, você terá:

- ✅ **Sistema totalmente seguro** para dados sensíveis
- ✅ **Conformidade LGPD** total
- ✅ **Experiência profissional** para usuários
- ✅ **Integração perfeita** com sua aplicação
- ✅ **Monitoramento** de segurança

**URLs finais:**
- Frontend: `https://analisalojamento.vercel.app`
- Backend: `https://seu-backend.vercel.app`
- Admin: `https://analisalojamento.vercel.app/admin/reset-password`

