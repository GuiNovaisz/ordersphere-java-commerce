# Operação local / Local operations

## Português

### Requisitos e configuração

Docker com engine Linux e Compose executa frontend Nginx, API e PostgreSQL. Para build no host, use Java 21+ e Maven Wrapper; frontend requer Node 24+ e npm. O build Java compila para 21; não altere permanentemente o Java do Windows para este projeto.

| Variável | Uso |
| --- | --- |
| `DB_PASSWORD` | Senha PostgreSQL obrigatória; defina localmente |
| `DB_USERNAME` | Usuário da execução local; padrão `ordersphere` |
| `JDBC_DATABASE_URL` | URL local; padrão `jdbc:postgresql://localhost:5432/ordersphere` |
| `ORDERSPHERE_ADMIN_EMAIL` | E-mail de bootstrap; obrigatório no Compose, opcional na aplicação |
| `ORDERSPHERE_ADMIN_PASSWORD` | Senha de bootstrap; obrigatória no Compose, opcional na aplicação |
| `SESSION_COOKIE_SECURE` | `false` no HTTP local; `true` com HTTPS |
| `WEB_PORT` | Porta host do frontend/proxy Compose; padrão 8080 |
| `API_PROXY_TARGET` | Destino do proxy Vite; padrão `http://localhost:8080` |
| `PORT` | Porta interna do processo local; padrão 8080 |

O Compose define URL, usuário e porta internos próprios e exige as credenciais de bootstrap para o primeiro acesso administrativo. Fora dele, e-mail e senha de bootstrap são opcionais, mas devem ser definidos juntos. `.env` é ignorado pelo Git e lido pelo Compose. Um processo Maven não carrega `.env` automaticamente. Nunca use os placeholders de `.env.example` como senha real em um ambiente compartilhado.

### Subir com Compose

```powershell
Copy-Item .env.example .env
# Edite as senhas localmente; não as coloque em logs ou commits.
docker compose config --quiet
docker compose up --build -d
docker compose ps
Invoke-RestMethod 'http://localhost:8080/actuator/health'
```

Somente `web` é publicado em loopback. Acesse `http://localhost:8080`, `/api/v1`, `/actuator/health` ou `/swagger-ui/index.html` pela mesma origem. API e PostgreSQL ficam internos, sem portas publicadas no host. Health checks coordenam banco → API → web. O volume nomeado persiste dados entre reinícios. Nginx executa non-root e entrega assets com fallback SPA; Java continua sendo o único backend.

Um banco novo inicia vazio. Faça login com o ADMIN configurado, crie produtos e ajuste estoque por delta. Para desenvolvimento frontend, execute `npm ci` e `npm run dev` em `frontend/`. Vite em localhost5173 usa `/api` via proxy ao localhost8080; esse destino pode ser a stack Compose ou a API no host. O backend no host ainda exige PostgreSQL alcançável como descrito abaixo. Não use `vite preview` como servidor de API: o proxy documentado pertence a `dev`; para validar o build completo use Compose.

Para E2E, utilize projeto/volume descartável e credenciais sintéticas próprias; a suíte cria produtos/clientes via API e altera estoque. Não aponte para banco de trabalho ou produção. Consulte [procedimento](../frontend/README.md). Para reiniciar sem apagar dados, use `docker compose restart`; sessões em memória serão perdidas quando a API reiniciar.

```powershell
docker compose logs --tail 100 api
docker compose down
```

`down` encerra o ambiente do projeto e preserva o volume. Não remova volumes para tentar resolver um erro sem compreender quais dados seriam perdidos. Alterar a senha em `.env` depois da primeira inicialização não modifica automaticamente a senha de um PostgreSQL já persistido.

### Build e testes no host

```powershell
.\mvnw.cmd clean verify
```

O Docker ativo é necessário aos testes de integração. Logs de testes ficam em `target/surefire-reports` e `target/failsafe-reports`. Para executar a API no host, forneça uma instância PostgreSQL acessível e variáveis no processo:

```powershell
$env:JDBC_DATABASE_URL = 'jdbc:postgresql://localhost:5432/ordersphere'
$env:DB_USERNAME = 'ordersphere'
# Defina DB_PASSWORD no ambiente do processo sem versioná-la.
.\mvnw.cmd spring-boot:run
```

O PostgreSQL padrão do Compose não publica 5432, portanto o comando local não se conecta automaticamente ao banco do Compose. Use o backend em container para o fluxo padrão ou configure deliberadamente uma instância de desenvolvimento acessível.

### Bootstrap e sessões

O bootstrap exige e-mail e senha juntos e só cria ADMIN se não existir nenhum. Não muda uma conta administrativa existente. Depois de provisionar a conta, as variáveis podem ser removidas do ambiente. Não há endpoint público para atribuir ADMIN.

Sessão expira após 30 minutos de inatividade e se perde ao reiniciar a API. Logout invalida sessão e cookie. O cliente deve obter token CSRF novamente após login/logout. Em um deploy HTTPS, habilite cookie Secure e configure o proxy/origem deliberadamente; não abra CORS para qualquer origem.

### Diagnóstico e evidências

`/actuator/health` expõe estado sem detalhes internos. Logs estruturados registram eventos técnicos sem corpos completos de request. Um conflito 409 exige consultar o estado antes de reenviar uma compra, pois criação não é idempotente. A [auditoria](audit.md) deve guardar resultados e URLs de CI, sem credenciais.

## English

Use Docker with a Linux engine and Compose for Nginx frontend, Spring API and PostgreSQL. Host builds require Java21+/Maven Wrapper and Node24+/npm for frontend. No permanent Windows Java changes are needed.

Copy `.env.example` to `.env`, set local passwords, run `docker compose config --quiet`, then `docker compose up --build -d`. Only web binds to loopback at localhost8080; `/api/v1`, health and Swagger use the same origin. API/PostgreSQL are internal. Health dependencies follow database → API → web. `docker compose down` preserves the database volume; changing environment passwords does not reset persisted PostgreSQL credentials. A new database has no products: create them and adjust stock through ADMIN.

`DB_PASSWORD` is required. Host defaults are `DB_USERNAME=ordersphere` and `JDBC_DATABASE_URL=jdbc:postgresql://localhost:5432/ordersphere`. Administrator bootstrap uses `ORDERSPHERE_ADMIN_EMAIL` and `ORDERSPHERE_ADMIN_PASSWORD` together, only when no ADMIN exists. Compose requires these credentials; bootstrap is optional outside Compose. `WEB_PORT` controls the Compose host port; `PORT` controls a host-run process. Use `SESSION_COOKIE_SECURE=true` for HTTPS.

For frontend development, run `npm ci`/`npm run dev` in `frontend/`. Vite localhost5173 proxies `/api` to localhost8080, configurable by `API_PROXY_TARGET`. Point it at Compose or the host API; do not enable broad CORS. `vite preview` is not the documented API proxy; validate the complete production build using Compose. E2E changes products/stock and creates customers: only run it against a disposable project/volume with synthetic credentials, as documented in the [frontend guide](../frontend/README.md).

Run `.\mvnw.cmd clean verify` on Windows or `./mvnw clean verify` on Unix. Docker is required for integration tests. Reports are under `target/surefire-reports` and `target/failsafe-reports`. For host execution, supply environment variables for a reachable PostgreSQL instance and use `spring-boot:run`; Maven does not automatically load `.env`, and the standard Compose database does not expose host port 5432.

Sessions expire after 30 minutes of inactivity and are lost on API restart. Logout invalidates the session. Fetch fresh CSRF tokens after login/logout. Health exposes no database details; structured logs avoid full request bodies. Check current order state before retrying a purchase because creation has no idempotency key. Record validation evidence in the [audit](audit.md), without secrets.
