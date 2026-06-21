# Ajustes V6 — Home Analítica

Esta versão muda a filosofia da Home: de monitoramento instantâneo para painel executivo/analítico preparado para receber dados consolidados pelo n8n.

## Alterações principais

- Substituição do render do chiller por uma imagem mais limpa e profissional (`public/assets/chiller-render-base.png`).
- Cards dos chillers mais compactos, com menos sobreposição sobre a imagem.
- Dados do chiller reorganizados em mini-cockpit: saúde, capacidade, Delta T, bypass, erro de setpoint, temperaturas, bombas, circuitos, partidas, horas e alarmes.
- Inclusão do bloco **O que mudou no período**, comparando hoje contra ontem, média semanal e janela de 48h.
- Inclusão de cards analíticos de tendência:
  - Saúde do pior chiller
  - Delta T médio
  - Bypass médio
  - Capacidade média
  - Erro de setpoint
  - Partidas acumuladas
- Inclusão do painel **Comparativo temporal**: hoje × ontem × 7 dias × 30 dias.
- Inclusão do painel **Correlação IA** com associações entre Delta T, bypass, capacidade e setpoint.
- Melhor uso do espaço em branco abaixo dos chillers.
- Home preparada visualmente para dados históricos e comparativos que serão entregues pelo n8n.

## Observação

Os dados ainda são mockados, mas já estão estruturados como visual esperado para receber payloads consolidados do n8n no futuro.
