@echo off
echo ================================
echo SETUP GESTIONALE AGENZIA
echo ================================
echo.

echo [1/5] Installazione dipendenze...
call npm install
if errorlevel 1 goto error

echo.
echo [2/5] Creazione database locale...
call npm run db:migrate:local
if errorlevel 1 goto error

echo.
echo [3/5] Caricamento dati di esempio...
call npm run db:seed
if errorlevel 1 goto error

echo.
echo [4/5] Build del progetto...
call npm run build
if errorlevel 1 goto error

echo.
echo [5/5] Avvio server...
echo.
echo ================================
echo INSTALLAZIONE COMPLETATA!
echo ================================
echo.
echo Apri il browser su: http://localhost:3000
echo.
echo Credenziali Admin:
echo   Email: admin@agenzia.it
echo   Password: admin123
echo.
echo Premi Ctrl+C per fermare il server
echo ================================
echo.

npx wrangler pages dev dist --d1=webapp-production --local --port 3000
goto end

:error
echo.
echo ================================
echo ERRORE DURANTE L'INSTALLAZIONE!
echo ================================
echo.
echo Controlla i messaggi di errore sopra.
echo Se serve aiuto, contattami!
pause
goto end

:end
