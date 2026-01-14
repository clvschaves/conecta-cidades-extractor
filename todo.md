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
