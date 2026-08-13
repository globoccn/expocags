# Relatórios CAG — integração frontend

Base: `stellar-command-center-ai-copilot-frontend-v2_3_sem_historico_refresh`

## Alterações desta revisão

- Área `/reports` mantém Relatório CAG + Demonstrativo de Consumo de Água.
- Relatório Diário agora possui geração sob demanda pelo botão `Gerar relatório diário` / `Gerar novamente`.
- Depois da geração, a tela atualiza automaticamente os metadados do relatório.
- Download continua separado pelo botão `Baixar PDF`.
- Semanal e Mensal permanecem preparados na interface, sem geração até publicação dos respectivos workflows.
- Removido o bloco lateral de prévia técnica do Demonstrativo de Água.
- Removidas menções visíveis à infraestrutura de automação.

## Endpoints usados pelo frontend

### Consultar metadados
`GET /webhook/cag/reports?type=daily&action=metadata`

### Baixar relatório pronto
`GET /webhook/cag/reports?type=daily&action=download`

### Gerar / regenerar relatório diário
`POST /webhook/cag/reports/daily/generate`

O endpoint de geração é fornecido pelo workflow `Expo CAG AI - Relatório DIÁRIO FINAL V4.2 - Geração Frontend`.

## Variáveis opcionais

- `VITE_CAG_REPORTS_URL`
- `VITE_CAG_DAILY_GENERATE_URL`
- `VITE_AGUA_DEMONSTRATIVO_URL`
- `VITE_AUTOMATION_BASE_URL`

Por compatibilidade, `VITE_N8N_WEBHOOK_BASE_URL` continua aceito internamente caso já exista no deploy.
