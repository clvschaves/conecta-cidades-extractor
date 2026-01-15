# Project TODO

## Backend - Banco de Dados e Schema
- [x] Criar tabela para armazenar histórico de extrações
- [x] Criar tabela para cache de dados de municípios
- [x] Definir tipos TypeScript para dados de saúde, educação e assistência

## Backend - Serviços de Extração
- [x] Implementar serviço de extração CNES (Saúde)
- [x] Implementar serviço de extração INEP (Educação)
- [x] Implementar serviço de extração SUAS (Assistência Social)
- [x] Implementar serviço de geocodificação de endereços
- [x] Implementar mapeamento de categorias para modelo Conecta Cidades

## Backend - Geração de XLSX
- [x] Instalar biblioteca para geração de XLSX (exceljs)
- [x] Implementar função de geração de arquivo XLSX com estrutura padronizada
- [x] Implementar upload de arquivo gerado para S3

## Backend - API tRPC
- [x] Criar rota para validação de código IBGE
- [x] Criar rota para iniciar extração com streaming de progresso
- [x] Criar rota para download do arquivo XLSX gerado

## Frontend - Interface
- [x] Criar página principal com formulário de entrada de código IBGE
- [x] Implementar validação de código IBGE (6 ou 7 dígitos)
- [x] Criar componente de indicadores de progresso por fase
- [x] Implementar visualização de status em tempo real
- [x] Criar botão de download do arquivo XLSX
- [x] Implementar tratamento de erros e feedback visual

## Testes
- [x] Testar extração completa com município real
- [x] Validar estrutura do arquivo XLSX gerado
- [x] Testar tratamento de erros (município inválido, APIs indisponíveis)

## Melhorias Solicitadas
- [x] Adicionar logs detalhados no console para acompanhar extração
- [x] Remover geocodificação obrigatória (aceitar apenas endereço)

## Nova Melhoria
- [x] Adicionar logs visíveis no console do navegador (frontend)
- [x] Criar painel visual de logs na interface

## Correção Urgente
- [x] Reimplementar serviço CNES baseado no código do Colab
- [x] Adicionar logs detalhados mostrando cada estabelecimento processado
- [x] Implementar tratamento de erros e retry

## Implementação Educação e Assistência
- [x] Criar tabelas no banco para dados de Educação (INEP) - Não necessário (leitura direta)
- [x] Criar tabelas no banco para dados de Assistência Social (SUAS) - Não necessário (leitura direta)
- [x] Implementar script de importação de dados da planilha de Educação - Download dinâmico
- [x] Implementar script de importação de dados da planilha de Assistência - Download dinâmico
- [x] Atualizar serviço INEP para consultar planilha consolidada
- [x] Atualizar serviço SUAS para mapear código IBGE para nome município

## Tabela de Municípios
- [x] Criar tabela de municípios no schema
- [x] Buscar dados de municípios da API do IBGE
- [x] Popular tabela com dados (5571 municípios)
- [x] Atualizar serviço SUAS para usar tabela de municípios

## Bug Crítico - Solução
- [x] Criar tabela para armazenar dados de educação no banco
- [x] Criar interface de upload de planilha XLSX
- [x] Implementar importação de dados da planilha para o banco
- [x] Atualizar serviço INEP para consultar banco ao invés de baixar planilha
- [x] Fazer o mesmo para planilha de Assistência Social

## Bug Urgente
- [x] Investigar por que extração retorna 0 registros em todas as categorias
- [x] Verificar logs do servidor para identificar erro na extração CNES
- [x] Adicionar logs mais frequentes para o frontend durante extração CNES
- [x] Reduzir timeout e melhorar tratamento de erro (15s lista, 10s detalhes, 50ms delay)
- [ ] Testar com município menor

## Bug Crítico - API CNES
- [x] Testar acesso direto à API CNES
- [x] Verificar se API está bloqueando requisições do servidor
- [x] Descoberto: API aceita apenas 6 dígitos (sem dígito verificador)
- [x] Corrigir serviço CNES para usar apenas 6 primeiros dígitos

## Melhoria de Logs
- [x] Adicionar logs detalhados de cada requisição HTTP
- [x] Mostrar tentativas e erros específicos
- [x] Enviar logs para frontend em tempo real
