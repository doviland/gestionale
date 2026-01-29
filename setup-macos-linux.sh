#!/bin/bash

echo "================================"
echo "SETUP GESTIONALE AGENZIA"
echo "================================"
echo ""

echo "[1/5] Installazione dipendenze..."
npm install
if [ $? -ne 0 ]; then
    echo "ERRORE: Installazione fallita!"
    exit 1
fi

echo ""
echo "[2/5] Creazione database locale..."
npm run db:migrate:local
if [ $? -ne 0 ]; then
    echo "ERRORE: Creazione database fallita!"
    exit 1
fi

echo ""
echo "[3/5] Caricamento dati di esempio..."
npm run db:seed
if [ $? -ne 0 ]; then
    echo "ERRORE: Caricamento dati fallito!"
    exit 1
fi

echo ""
echo "[4/5] Build del progetto..."
npm run build
if [ $? -ne 0 ]; then
    echo "ERRORE: Build fallito!"
    exit 1
fi

echo ""
echo "[5/5] Avvio server..."
echo ""
echo "================================"
echo "INSTALLAZIONE COMPLETATA!"
echo "================================"
echo ""
echo "Apri il browser su: http://localhost:3000"
echo ""
echo "Credenziali Admin:"
echo "  Email: admin@agenzia.it"
echo "  Password: admin123"
echo ""
echo "Premi Ctrl+C per fermare il server"
echo "================================"
echo ""

npx wrangler pages dev dist --d1=webapp-production --local --port 3000
