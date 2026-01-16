# Conecta Cidades - Extrator de Dados Municipais

Sistema automatizado para extração de dados de equipamentos públicos municipais (Saúde, Educação e Assistência Social) e geração de planilhas padronizadas no formato Conecta Cidades.

## 📋 Funcionalidades

- **Extração de Dados de Saúde**: Consulta automática à API do CNES (Cadastro Nacional de Estabelecimentos de Saúde) por código IBGE do município
- **Extração de Dados de Educação**: Consulta a banco de dados local com 212.386 escolas do Censo Escolar (INEP)
- **Extração de Dados de Assistência Social**: Consulta a banco de dados local com 12.574 equipamentos CRAS/CREAS do Censo SUAS
- **Logs em Tempo Real**: Acompanhamento detalhado do processo via Server-Sent Events (SSE)
- **Indicador de Progresso**: Barra de progresso refletindo etapas reais (40% saúde, 70% educação, 90% assistência, 100% completo)
- **Geração de XLSX**: Arquivo padronizado com colunas: Secretaria/Órgão, Categoria/Subcategoria, Nome, Endereço, Latitude, Longitude, Horários por dia da semana

## 🛠️ Tecnologias Utilizadas

- **Frontend**: React 19 + Tailwind CSS 4 + shadcn/ui
- **Backend**: Node.js 22 + Express 4 + tRPC 11
- **Banco de Dados**: MySQL 8.0 / TiDB Serverless
- **ORM**: Drizzle ORM
- **Containerização**: Docker + Docker Compose

## 📦 Pré-requisitos

- Docker 20.10+
- Docker Compose 2.0+
- 4GB RAM disponível
- 10GB espaço em disco (para banco de dados com dados completos)

## 🚀 Instalação e Execução

### 1. Clone o Repositório

```bash
git clone https://github.com/seu-usuario/conecta-cidades-extractor.git
cd conecta-cidades-extractor
```

### 2. Configure as Variáveis de Ambiente

Copie o arquivo de exemplo e edite conforme necessário:

```bash
cp .env.example .env
```

**Variáveis obrigatórias** (já configuradas no `.env.example`):
- `MYSQL_ROOT_PASSWORD`: Senha do root do MySQL
- `MYSQL_DATABASE`: Nome do banco de dados
- `MYSQL_USER`: Usuário do banco de dados
- `MYSQL_PASSWORD`: Senha do usuário do banco
- `JWT_SECRET`: Chave secreta para JWT (ALTERE EM PRODUÇÃO!)

**Variáveis opcionais** (para recursos avançados):
- Autenticação Manus OAuth: `VITE_APP_ID`, `OAUTH_SERVER_URL`, etc.
- APIs Manus: `BUILT_IN_FORGE_API_KEY`, `BUILT_IN_FORGE_API_URL`
- Analytics: `VITE_ANALYTICS_ENDPOINT`, `VITE_ANALYTICS_WEBSITE_ID`

### 3. Inicie os Serviços com Docker Compose

```bash
docker-compose up -d
```

Este comando irá:
1. Baixar as imagens necessárias (MySQL 8.0 e Node 22)
2. Criar o banco de dados e importar o dump completo (212k escolas + 12k equipamentos)
3. Construir a aplicação
4. Iniciar os serviços

**Primeira execução**: A importação do banco pode levar 5-10 minutos dependendo do hardware.

### 4. Acesse a Aplicação

Abra o navegador em: **http://localhost:3000**

## 📊 Uso do Sistema

### Extração de Dados

1. Digite o **código IBGE** do município (6 ou 7 dígitos)
   - Exemplo: `270030` (Arapiraca/AL) ou `2611606` (Recife/PE)
2. Clique em **"Iniciar Extração"**
3. Acompanhe o progresso em tempo real no **Console de Logs**
4. Aguarde a conclusão (tempo varia conforme tamanho do município)
5. Clique em **"Baixar Arquivo XLSX"** para obter a planilha gerada

### Estrutura do Arquivo XLSX Gerado

| Coluna | Descrição |
|--------|-----------|
| Secretaria/Órgão | Órgão responsável (Saúde, Educação, Assistência Social) |
| Categoria | Categoria principal do estabelecimento |
| Subcategoria | Subcategoria específica |
| Nome | Nome completo do estabelecimento |
| Endereço | Endereço completo |
| Latitude | Coordenada de latitude (quando disponível) |
| Longitude | Coordenada de longitude (quando disponível) |
| Descrição | Informações adicionais |
| Segunda a Domingo | Horários de funcionamento por dia da semana |

## 🗄️ Estrutura do Banco de Dados

### Tabelas Principais

- **`users`**: Usuários do sistema (autenticação)
- **`municipios`**: 5.571 municípios brasileiros (código IBGE + nome)
- **`escolas`**: 212.386 escolas do Censo Escolar (INEP)
- **`equipamentosAssistencia`**: 12.574 equipamentos CRAS/CREAS (Censo SUAS)
- **`extractions`**: Histórico de extrações realizadas

### Importação de Dados Adicionais

Se precisar reimportar ou atualizar os dados:

```bash
# Acessar container da aplicação
docker exec -it conecta-cidades-app sh

# Executar scripts de importação
npx tsx scripts/populate-municipios.mjs
npx tsx scripts/import-educacao.mjs
npx tsx scripts/import-assistencia.mjs
```

## 🔧 Desenvolvimento Local (Sem Docker)

### Pré-requisitos

- Node.js 22+
- pnpm 10+
- MySQL 8.0+

### Instalação

```bash
# Instalar dependências
pnpm install

# Configurar banco de dados
# Edite DATABASE_URL no .env para apontar para seu MySQL local

# Executar migrações
pnpm db:push

# Popular dados
npx tsx scripts/populate-municipios.mjs
npx tsx scripts/import-educacao.mjs
npx tsx scripts/import-assistencia.mjs

# Iniciar em modo desenvolvimento
pnpm dev
```

Acesse: **http://localhost:3000**

## 📝 Scripts Disponíveis

```bash
pnpm dev          # Inicia servidor de desenvolvimento
pnpm build        # Compila para produção
pnpm start        # Inicia servidor de produção
pnpm test         # Executa testes unitários
pnpm db:push      # Aplica mudanças no schema do banco
```

## 🐛 Solução de Problemas

### Erro: "Cannot connect to database"

Verifique se o container do banco está rodando:
```bash
docker ps
docker logs conecta-cidades-db
```

### Erro: "Port 3000 already in use"

Altere a porta no `.env`:
```env
APP_PORT=8080
```

E reinicie:
```bash
docker-compose down
docker-compose up -d
```

### Banco de dados vazio após inicialização

Verifique se o dump foi importado corretamente:
```bash
docker exec -it conecta-cidades-db mysql -u conecta -pconecta_password conecta_cidades -e "SELECT COUNT(*) FROM escolas;"
```

Se retornar 0, reimporte manualmente:
```bash
docker exec -i conecta-cidades-db mysql -u conecta -pconecta_password conecta_cidades < database/init.sql
```

## 📂 Estrutura do Projeto

```
conecta-cidades-extractor/
├── client/                 # Frontend React
│   ├── src/
│   │   ├── pages/         # Páginas da aplicação
│   │   ├── components/    # Componentes reutilizáveis
│   │   └── lib/           # Configurações (tRPC, etc)
│   └── public/            # Assets estáticos
├── server/                # Backend Node.js
│   ├── services/          # Serviços de extração (CNES, INEP, SUAS)
│   ├── routers/           # Rotas tRPC
│   ├── routes/            # Rotas Express (SSE, upload)
│   └── _core/             # Configurações do servidor
├── drizzle/               # Schema e migrações do banco
├── scripts/               # Scripts de importação de dados
├── database/              # Dump do banco de dados
├── uploads/               # Arquivos XLSX gerados
├── docker-compose.yml     # Configuração Docker Compose
├── Dockerfile             # Imagem Docker da aplicação
└── README.md              # Este arquivo
```

## 🔐 Segurança

- **IMPORTANTE**: Altere `JWT_SECRET` no `.env` antes de colocar em produção
- Não exponha as portas do banco de dados (3306) publicamente
- Use HTTPS em produção (configure reverse proxy como Nginx)
- Mantenha as dependências atualizadas: `pnpm update`

## 📄 Licença

MIT License - Sinta-se livre para usar e modificar este projeto.

## 🤝 Contribuindo

Contribuições são bem-vindas! Por favor:

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'Adiciona MinhaFeature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

## 📞 Suporte

Para dúvidas ou problemas:
- Abra uma issue no GitHub
- Entre em contato via email: suporte@conectacidades.com.br

---

**Desenvolvido com ❤️ para facilitar o acesso a dados públicos municipais**
