# 🔥 Configuração do Firebase Admin SDK

## Objetivo
Integrar o backend customizado com o Firebase Authentication para que as senhas redefinidas sejam efetivamente atualizadas no Firebase.

## Passo a Passo

### 1. Obter Credenciais do Firebase

1. **Acesse o Firebase Console:**
   - Vá para [https://console.firebase.google.com](https://console.firebase.google.com)
   - Selecione seu projeto (`caixinha-fa863`)

2. **Gerar Service Account:**
   - Clique no ícone de engrenagem ⚙️ → **"Project Settings"**
   - Vá para a aba **"Service accounts"**
   - Selecione **"Node.js"** no Admin SDK configuration snippet
   - Clique em **"Generate new private key"**
   - Baixe o arquivo JSON (ex: `caixinha-fa863-firebase-adminsdk-xxxxx.json`)

3. **Extrair Informações do JSON:**
   Abra o arquivo JSON baixado e copie as seguintes informações:
   - `project_id`
   - `private_key_id`
   - `private_key`
   - `client_email`
   - `client_id`

### 2. Configurar Variáveis de Ambiente no Vercel

1. **Acesse o Dashboard do Vercel:**
   - Vá para [vercel.com](https://vercel.com)
   - Selecione o projeto do **backend**

2. **Adicionar Environment Variables:**
   - Vá em **Settings → Environment Variables**
   - Adicione as seguintes variáveis:

   ```
   FIREBASE_PROJECT_ID = caixinha-fa863
   FIREBASE_PRIVATE_KEY_ID = valor_do_private_key_id
   FIREBASE_PRIVATE_KEY = valor_completo_da_private_key_com_quebras_de_linha
   FIREBASE_CLIENT_EMAIL = firebase-adminsdk-xxxxx@caixinha-fa863.iam.gserviceaccount.com
   FIREBASE_CLIENT_ID = valor_do_client_id
   ```

   **⚠️ IMPORTANTE:** Para a `FIREBASE_PRIVATE_KEY`, copie o valor completo incluindo as quebras de linha (`\\n`).

3. **Configurar para todos os ambientes:**
   - Marque **Production**, **Preview** e **Development**
   - Clique em **Save**

### 3. Redeploy do Backend

1. **Após configurar as variáveis:**
   - Vá para **Deployments**
   - Clique nos três pontos (...) do último deployment
   - Selecione **"Redeploy"**
   - Confirme o redeploy

### 4. Verificar Funcionamento

1. **Teste o Health Check:**
   - Acesse: `https://sua-url-backend.vercel.app/health`
   - Verifique se `firebaseInitialized: true`

2. **Teste o Fluxo Completo:**
   - Gere um link de redefinição
   - Redefina a senha
   - Tente fazer login no sistema

## Como Funciona

### Fluxo Integrado:
1. **Usuário solicita redefinição** → Backend gera token customizado
2. **Usuário acessa link** → Backend valida token
3. **Usuário define nova senha** → Backend:
   - Valida a nova senha
   - Busca o UID do usuário no Firebase pelo email
   - Usa `admin.auth().updateUser()` para atualizar a senha no Firebase
   - Marca o token como usado
4. **Usuário faz login** → Firebase Authentication reconhece a nova senha ✅

### Vantagens:
- ✅ Mantém o fluxo customizado de redefinição
- ✅ Mantém as telas personalizadas
- ✅ Integra com Firebase Authentication no final
- ✅ Não expõe API keys no frontend
- ✅ Controle total sobre o processo

## Troubleshooting

### Erro: "Firebase Admin SDK não está inicializado"
- Verifique se todas as variáveis de ambiente estão configuradas
- Confirme se o redeploy foi feito após adicionar as variáveis

### Erro: "Usuário não encontrado no Firebase"
- Certifique-se de que o usuário existe no Firebase Authentication
- Verifique se o email está correto

### Erro: "Invalid private key"
- Verifique se a `FIREBASE_PRIVATE_KEY` foi copiada corretamente
- Certifique-se de incluir as quebras de linha (`\\n`)

## Logs para Debug

O backend agora inclui logs detalhados:
- `🔥 Firebase Admin SDK inicializado com sucesso`
- `🔥 Senha atualizada no Firebase para: email@exemplo.com`
- `⚠️ Firebase não configurado - senha não será atualizada no Firebase`

Monitore os logs do Vercel para identificar problemas.

