# Configuração de Email e URLs - Supabase

## 1. Configurar Site URL e Redirect URLs

### Acesse o Supabase Dashboard:
1. Vá para: https://supabase.com/dashboard/project/lstbjfcupoowfeunlcly/auth/url-configuration

### Configure o Site URL:
- **Site URL**: Coloque a URL publicada do seu app (ex: `https://seu-app.lovable.app`)

### Configure Redirect URLs:
Adicione as seguintes URLs na lista de Redirect URLs:
- `https://seu-app.lovable.app/reset-password`
- `http://localhost:3000/reset-password` (para desenvolvimento local)

## 2. Customizar Template de Email

### Acesse os Templates de Email:
1. Vá para: https://supabase.com/dashboard/project/lstbjfcupoowfeunlcly/auth/templates

### Edite o Template "Reset Password":
Cole o HTML abaixo no editor de template:

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); overflow: hidden;">
          <!-- Header com Logo -->
          <tr>
            <td align="center" style="padding: 40px 40px 20px 40px;">
              <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #FCD34D 0%, #F59E0B 100%); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; box-shadow: 0 8px 24px rgba(245, 158, 11, 0.3);">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M13 2L3 14h8l-1 8 10-12h-8l1-8z" fill="#ffffff" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
            </td>
          </tr>
          
          <!-- Título -->
          <tr>
            <td align="center" style="padding: 0 40px 20px 40px;">
              <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #1a1a1a; letter-spacing: -0.5px;">
                Redefinir Senha
              </h1>
            </td>
          </tr>
          
          <!-- Descrição -->
          <tr>
            <td align="center" style="padding: 0 40px 30px 40px;">
              <p style="margin: 0; font-size: 16px; line-height: 24px; color: #666666;">
                Recebemos uma solicitação para redefinir sua senha. Clique no botão abaixo para criar uma nova senha.
              </p>
            </td>
          </tr>
          
          <!-- Botão -->
          <tr>
            <td align="center" style="padding: 0 40px 30px 40px;">
              <a href="{{ .ConfirmationURL }}" style="display: inline-block; padding: 16px 48px; background: linear-gradient(135deg, #FCD34D 0%, #F59E0B 100%); color: #1a1a1a; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);">
                Redefinir Senha
              </a>
            </td>
          </tr>
          
          <!-- Link alternativo -->
          <tr>
            <td align="center" style="padding: 0 40px 20px 40px;">
              <p style="margin: 0; font-size: 14px; color: #999999;">
                Se o botão não funcionar, copie e cole este link no navegador:
              </p>
              <p style="margin: 10px 0 0 0; font-size: 14px;">
                <a href="{{ .ConfirmationURL }}" style="color: #F59E0B; word-break: break-all;">{{ .ConfirmationURL }}</a>
              </p>
            </td>
          </tr>
          
          <!-- Aviso de segurança -->
          <tr>
            <td style="padding: 30px 40px; background-color: #f9fafb; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; font-size: 14px; line-height: 20px; color: #666666;">
                ⚠️ Se você não solicitou esta redefinição de senha, pode ignorar este email com segurança.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td align="center" style="padding: 20px 40px 40px 40px;">
              <p style="margin: 0; font-size: 12px; color: #999999;">
                Este é um email automático, por favor não responda.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

### Importante:
- Mantenha a variável `{{ .ConfirmationURL }}` - ela é substituída automaticamente pelo Supabase com o link correto
- O link usará automaticamente o Site URL configurado + `/reset-password`

## 3. Testar o Fluxo

Após configurar:
1. Vá para a página de login e clique em "Esqueceu a senha?"
2. Digite seu email
3. Verifique o email recebido
4. Confirme que:
   - ✅ O ícone do raio aparece corretamente na bola amarela
   - ✅ O botão redireciona para a URL publicada (não localhost)
   - ✅ A página de redefinição carrega corretamente
