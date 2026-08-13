# Integração Relatórios CAG

Frontend habilitado para Diário, Semanal e Mensal.

Endpoints de consulta/download:
- GET /webhook/cag/reports?type=daily|weekly|monthly&action=metadata|download

Geração sob demanda:
- POST /webhook/cag/reports/daily/generate
- POST /webhook/cag/reports/weekly/generate
- POST /webhook/cag/reports/monthly/generate

A geração aguarda o workflow, consulta o PDF recém-publicado pela API e inicia o download automaticamente.
