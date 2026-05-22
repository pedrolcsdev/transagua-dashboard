# Transagua Dashboard

Dashboard SPA em React + Vite com rotas de cliente via `react-router-dom`.

## Desenvolvimento

- `npm run dev`
- `npm run build`
- `npm run preview`

## Deploy

Como o app usa `BrowserRouter`, qualquer hospedagem precisa de fallback de SPA para `index.html` nas rotas internas.

Na Vercel, isso fica configurado em `vercel.json` para que URLs como `/dashboard` e `/relatorios` continuem funcionando ao abrir direto ou atualizar a página.
