This contains everything you need to run your app locally.

## Run Locally

#Pré-requisitos

Certifique-se de ter o Node.js instalado. Você pode baixar em nodejs.org. Recomendo a versão LTS (mais estável).

1. Prepare a Pasta do Projeto

Se você baixou o arquivo .zip...

Extraia o conteúdo do arquivo em uma pasta de sua preferência.

Abra o terminal (ou Prompt de Comando/PowerShell) nessa pasta.

2. Instalação das Dependências

No terminal, dentro da pasta do projeto, execute o seguinte comando para baixar todas as bibliotecas necessárias (como React, Lucide e Papaparse):

code

Bash

npm install

3. Configuração das Variáveis de Ambiente

O projeto possui um arquivo chamado .env.example. Você precisa criar uma cópia dele chamada apenas .env:

No Windows (PowerShell): cp .env.example .env

No Mac/Linux: cp .env.example .env

(Nota: Como este app usa o localStorage para o "Banco de Dados" local, você não precisa de chaves de API externas para as funções básicas de cadastro e consulta).

4. Iniciar o Servidor de Desenvolvimento

Agora, inicie o aplicativo com:

code

Bash

npm run dev

5. Acessar o Aplicativo

Após o comando acima, o terminal mostrará um link (geralmente http://localhost:3000 ou http://localhost:5173).

Segure Ctrl e clique no link ou copie e cole no seu navegador.

O sistema de Gestão Escolar estará funcionando!

Para criar um executável:
Coloque o aquivo de lote no diretório raiz.
@echo off
title Iniciando Sistema de Gestao Escolar
echo ==========================================
echo    SISTEMA DE GESTAO ALUNOS DA PEDRO -
echo ==========================================
echo.

echo Iniciando servidor local...
echo O programa abrira automaticamente no seu navegador.
echo NAO FECHE ESTA JANELA ENQUANTO ESTIVER USANDO O SISTEMA.
echo.

:: Abre o navegador e inicia o servidor
start http://localhost:3000
call npm run dev
pause

