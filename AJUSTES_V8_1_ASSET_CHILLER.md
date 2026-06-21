# Ajustes V8.1 — Correção do asset do chiller

- Corrigido o carregamento da imagem do chiller.
- Removida a dependência do caminho remoto `__l5e/assets-v1`, que quebrava fora do ambiente Lovable.
- Adicionado o arquivo `src/assets/chiller.png` no projeto.
- Alterado `HomeChillerCard` para importar a imagem local via Vite.
- Aumentado o protagonismo do render dentro do card.
- Reduzido levemente o Health Score para não competir visualmente com o equipamento.
