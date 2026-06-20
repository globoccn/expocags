# Ajustes Home V5

Alterações aplicadas manualmente na Home para aproximar a aplicação do conceito de cockpit premium:

- Substituição do asset do chiller por uma imagem limpa, sem textos embutidos.
- Refino do componente `EquipmentRender` para usar a mesma imagem base com identidade visual por chiller.
- Redução de altura dos cards dos chillers e diminuição dos espaços internos.
- Integração do Health Score e Capacidade sobre o render, como elementos de cockpit.
- Reorganização das métricas dos cards: Delta T, erro de setpoint, temperatura externa, setpoint, alimentação, retorno, bombas, circuitos, demanda, partidas, bypass e horas.
- Compactação do grid da Home para reduzir espaçamentos entre KPIs, cards, IA, eventos e comparativos.
- Remoção do painel inferior de indicadores operacionais da Home para reduzir poluição visual.
- Mantida estrutura de dados mockados e preparação para futura alimentação via n8n.

Observação: a página Home foi priorizada. Páginas internas ficam para a próxima etapa.
