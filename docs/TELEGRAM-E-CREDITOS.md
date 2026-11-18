# MANDRACKE CENTER — Telegram, usuários e créditos

## O que está implementado
- O usuário clica em "Abrir bot" na tela /login, conversa com o bot Telegram vinculado ao Telegram ID e recebe uma key aleatória de uso único.
- A key vence após 10 minutos. O servidor armazena apenas o hash SHA-256 da key.
- No login, uma função SQL consome a key de forma atômica e cria uma sessão HttpOnly de 8 horas.
- A tela /member mostra o saldo real da tabela mc_users, as recargas pendentes e links da comunidade e suporte.
- Recargas são **pedidos**: não há pagamento nem crédito automático. Um administrador aprova ou recusa em Usuários, que atualiza saldo por transação SQL.
- Em /panel, a categoria "Usuários" exibe a base real do Telegram. Os demais módulos preservam a interface original; números demonstrativos no dashboard não são saldos reais.
- O menu lateral ordena itens dentro da mesma categoria, permite fixar favoritos e usa setas para reordenar no celular. A preferência é salva neste navegador via localStorage (não é sincronizada entre dispositivos).

## Preparação necessária
1. Criar projeto Supabase sob seu controle.
2. No Supabase SQL Editor, executar o arquivo supabase/schema.sql.
3. Criar bot Telegram no @BotFather. Não envie o token por chat nem salve no GitHub.
4. Na Vercel > projeto painel > Settings > Environment Variables, configurar SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, TELEGRAM_BOT_TOKEN, TELEGRAM_BOT_USERNAME (sem @), TELEGRAM_WEBHOOK_SECRET (valor aleatório >= 16 caracteres) e CENTRAL_GROUP_URL (convite oficial). Também manter ADMIN_PASSWORD e SESSION_SECRET.
5. Marcar Production e Preview; redeploy para aplicar as variáveis.
6. Registrar webhook via Telegram Bot API setWebhook apontando para https://SEU-DOMINIO/api/telegram/webhook, com secret_token exatamente igual ao TELEGRAM_WEBHOOK_SECRET. Opcionalmente usar scripts/setup-telegram-webhook.mjs com as variáveis definidas no seu ambiente local.
7. Abrir o link do bot na tela de login, usar /start, copiar a key e colar no login. Um usuário aparecerá no painel administrativo.
8. Enviar pedido de recarga e aprová-lo em Usuários. O saldo só será alterado após aprovação.

## Segurança
- **Nunca** coloque os segredos de admin, bot ou Supabase no HTML ou nos scripts do navegador.
- A rota webhook exige o header X-Telegram-Bot-Api-Secret-Token igual ao segredo cadastrado.
- As tabelas Supabase têm RLS ativada; apenas o servidor com chave service_role acessa usuários e saldos.
- Se @BotFather ainda não estiver configurado, o login mostra "bot ainda não configurado".
- Configure limite de tentativas/WAF para login de administrador e alertas de erros antes de uso em produção.
- A ligação Telegram prova acesso à conta que interagiu com o bot, não identidade civil da pessoa.
- O projeto não efetua pagamentos ou transfere dinheiro. Recargas são controle interno de créditos e requerem validação do administrador.
- O login antigo de administrador continua existindo. Usuários Telegram acessam somente /member, não /panel.
