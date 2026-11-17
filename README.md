# Site oficial da Marketing Vision

Página única com as soluções (Espia só e landing pages), os serviços (tráfego pago, landing pages e sites, motion, 3D e VFX), clientes, método e o formulário para agendar reunião.

## Estrutura

- `index.html`, `css/site.css`, `js/site.js`: o site, sem etapa de build.
- `api/reuniao.js`: recebe o formulário e guarda cada pedido no Vercel Blob (privado).
- `painel.html` e `api/pedidos.js`: painel com a lista de pedidos, protegido pela chave `PAINEL_TOKEN`.

## Variáveis na Vercel

- `BLOB_READ_WRITE_TOKEN`: criada ao conectar o Blob store ao projeto.
- `PAINEL_TOKEN`: chave de acesso ao painel.
- `SITE_HOSTS` (opcional): domínio próprio, separado por vírgula, para o formulário aceitar envios dele.

## Publicação

Cada push na branch `main` publica uma nova versão na Vercel.
