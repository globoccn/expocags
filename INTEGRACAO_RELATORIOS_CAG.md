# Integração — Relatórios CAG

Base: stellar-command-center-ai-copilot-frontend-v2_3_sem_historico_refresh

Alterações aplicadas apenas sobre esta base:

- Item lateral `Relatórios Hidrômetros` renomeado para `Relatórios`.
- `/reports` passa a ser um Centro de Relatórios.
- Novo bloco `Relatório CAG` com Diário, Semanal e Mensal.
- Diário consulta `GET /webhook/cag/reports?type=daily&action=metadata`.
- Download do Diário usa `GET /webhook/cag/reports?type=daily&action=download`.
- Semanal e Mensal já estão preparados na interface e aparecem como não publicados enquanto não houver relatório.
- Demonstrativo de água foi preservado na mesma página e continua usando `agua-ai/demonstrativo`.
- O cabeçalho em `/reports` não exibe o seletor global do dashboard para evitar conflito conceitual; a troca de tema continua disponível.

Variáveis opcionais:

- `VITE_N8N_WEBHOOK_BASE_URL`
- `VITE_CAG_REPORTS_URL`
- `VITE_AGUA_DEMONSTRATIVO_URL`

Fallback do n8n: `https://ancar-n8n.gpfgqx.easypanel.host/webhook`
