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