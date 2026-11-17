# Site oficial da Marketing Vision

Página única com as soluções (Espia só e landing pages), os serviços (tráfego pago, landing pages e sites, motion, 3D e VFX), clientes, método e o formulário para agendar reunião.

## Estrutura

- `index.html`, `css/site.css`, `js/site.js`: o site, sem etapa de build.
- `api/reuniao.js`: recebe o formulário e guarda cada pedido no Vercel Blob (privado).
- `painel.html`, `css/painel.css` e `js/painel.js`: painel central da Marketing Vision (visão geral, leads, clientes, contratos, entregas, workflow comercial e habilidades), protegido pela chave `PAINEL_TOKEN`.
- `api/central.js`: guarda os dados do painel num único arquivo privado no Blob (`db/central.json`), com controle de versão para ninguém sobrescrever o que o outro salvou. Na primeira abertura usa os dados iniciais de `api/_lib/seed.js`.
- `api/pedidos.js`: lista e exclui os pedidos dos formulários (site e landing pages).

## Variáveis na Vercel

- `BLOB_READ_WRITE_TOKEN`: criada ao conectar o Blob store ao projeto.
- `PAINEL_TOKEN`: chave de acesso ao painel.
- `SITE_HOSTS` (opcional): domínio próprio, separado por vírgula, para o formulário aceitar envios dele.

## Publicação

Cada push na branch `main` publica uma nova versão na Vercel.
