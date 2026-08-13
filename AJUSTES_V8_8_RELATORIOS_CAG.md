# V8.8 — Relatórios CAG no frontend

A rota `/reports` agora é um Centro de Relatórios com duas áreas: Relatório CAG e Demonstrativo de Água.

## Relatório CAG
Opções já disponíveis na interface: Diário, Semanal e Mensal.

Contrato da API:
`GET /webhook/cag/reports?type=daily|weekly|monthly&action=metadata|download`

Variável opcional:
`VITE_CAG_REPORTS_URL=https://.../webhook/cag/reports`

`action=metadata` carrega apenas metadados. `action=download` inclui `report.pdf.base64` para download no navegador.

Semanal e Mensal já estão preparados no frontend. Enquanto não houver publicação no Redis, aparecem como "Ainda não publicado".

## Demonstrativo de água
A funcionalidade existente foi preservada e continua usando `POST /webhook/agua-ai/demonstrativo`.
