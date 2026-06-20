# Ajustes executados — Home V1.1

## Foco da alteração
Refino da tela principal para deixar a Home mais parecida com um cockpit executivo da CAG, com melhor hierarquia visual, mais análise comparativa e menos sobreposição de informações.

## Alterações realizadas

1. Cards dos 3 chillers refeitos como mini-cockpits:
   - render maior e mais limpo;
   - Health Score em bloco dedicado;
   - capacidade em destaque;
   - Delta T, erro de setpoint e temperatura externa priorizados;
   - dados auxiliares organizados em tiles;
   - inclusão de demanda, partidas, bypass e horas;
   - insight da IA mantido no rodapé do card.

2. Render do chiller refinado:
   - removida a etiqueta extra sobre o render para evitar texto sobre imagem;
   - imagem passou a usar object-contain para reduzir cortes e sobreposição;
   - mantido glow por identidade do equipamento.

3. KPIs superiores ajustados:
   - inclusão de Chiller Crítico;
   - inclusão de Bombas em Atenção;
   - mantidos indicadores de Saúde, Anomalias, Chillers, Bombas, Compressores e Comunicação.

4. Novos painéis na Home:
   - Comparativo dos Chillers;
   - Distribuição da Carga;
   - Análise Cruzada Delta T x Bypass;
   - Indicadores Operacionais do Período.

5. Painel da IA refinado:
   - destaque para causa provável;
   - destaque para impacto;
   - recomendação mais objetiva.

6. Eventos recentes compactados:
   - mantida linha do tempo com cor do chiller;
   - exibição limitada aos principais eventos da Home.

7. Configuração Vite:
   - adicionado allowedHosts para expocenternorte.2see.io.

## Observação
Não foi possível validar o build localmente porque o projeto enviado não continha node_modules e a instalação de dependências excedeu o tempo disponível no ambiente. As alterações foram feitas diretamente nos arquivos React/TypeScript.
