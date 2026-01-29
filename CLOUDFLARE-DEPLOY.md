# 🚀 Guida Completa: Deploy su Cloudflare Pages

Questa guida ti accompagna passo-passo nel mettere online il tuo gestionale su Cloudflare Pages **GRATUITAMENTE**.

## 📋 Cosa Otterrai

- ✅ **URL pubblico** tipo: `https://gestionale-agenzia.pages.dev`
- ✅ **HTTPS automatico** (certificato SSL gratis)
- ✅ **Accessibile da ovunque** nel mondo
- ✅ **Edge network globale** di Cloudflare
- ✅ **Database D1** incluso nel piano gratuito
- ✅ **Zero costi** per piccoli progetti

---

## 🎯 STEP 1: Crea Account Cloudflare (5 minuti)

1. **Vai su**: https://dash.cloudflare.com/sign-up
2. **Registrati** con la tua email
3. **Conferma** l'email che riceverai
4. **Login**: https://dash.cloudflare.com/

✅ **Account creato!** Ora hai accesso gratuito a tutti i servizi.

---

## 🔑 STEP 2: Ottieni API Token (3 minuti)

1. **Vai su**: https://dash.cloudflare.com/profile/api-tokens
2. Clicca su **"Create Token"** (pulsante blu)
3. Scegli il template **"Edit Cloudflare Workers"**
4. Oppure crea un custom token con questi permessi:
   - Account → **Cloudflare Pages** → **Edit**
   - Account → **D1** → **Edit**
5. Clicca **"Continue to summary"**
6. Clicca **"Create Token"**
7. **COPIA IL TOKEN** (lo vedrai solo una volta!)
   - Formato: `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
   - **IMPORTANTE**: Salvalo in un posto sicuro!

---

## 💻 STEP 3: Installa Wrangler (2 minuti)

Apri il **Terminale** (su Windows: PowerShell o CMD, su Mac: Terminal):

```bash
# Installa Wrangler globalmente
npm install -g wrangler

# Verifica installazione
wrangler --version
```

Dovresti vedere qualcosa come: `⛅️ wrangler 3.78.0`

---

## 🔐 STEP 4: Login con Wrangler (2 minuti)

### Opzione A: Login Browser (Consigliato)
```bash
wrangler login
```
Si aprirà il browser → clicca **"Allow"** → Fatto!

### Opzione B: Login con API Token
```bash
# Se il browser non si apre, usa il token che hai copiato prima
export CLOUDFLARE_API_TOKEN=il_tuo_token_qui

# Verifica che funzioni
wrangler whoami
```

Dovresti vedere il tuo account Cloudflare.

---

## 🗄️ STEP 5: Crea Database D1 (2 minuti)

```bash
# Naviga nella cartella del progetto
cd /path/to/gestionale

# Crea il database D1
wrangler d1 create gestionale-agenzia-production

# Output che vedrai:
# ✅ Successfully created DB 'gestionale-agenzia-production'
# database_id = "xxxx-xxxx-xxxx-xxxx"
```

**IMPORTANTE**: Copia il `database_id` che vedi nell'output!

---

## ⚙️ STEP 6: Configura wrangler.jsonc (3 minuti)

Apri il file `wrangler.jsonc` nel progetto e modifica:

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "gestionale-agenzia",
  "compatibility_date": "2026-01-29",
  "pages_build_output_dir": "./dist",
  "compatibility_flags": ["nodejs_compat"],
  
  // Incolla qui il database_id che hai copiato prima
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "gestionale-agenzia-production",
      "database_id": "INCOLLA_QUI_IL_TUO_DATABASE_ID"
    }
  ]
}
```

**Salva il file!**

---

## 📊 STEP 7: Applica Migrations al Database (2 minuti)

```bash
# Applica le migrations al database production
wrangler d1 migrations apply gestionale-agenzia-production

# Se vedi errori, aggiungi --remote:
wrangler d1 migrations apply gestionale-agenzia-production --remote
```

Output:
```
✅ 1 migration applied
- 0001_initial_schema.sql
```

---

## 🏗️ STEP 8: Build il Progetto (1 minuto)

```bash
# Build production
npm run build
```

Vedrai:
```
✓ 50 modules transformed.
dist/_worker.js  89.20 kB
✓ built in 800ms
```

La cartella `dist/` è pronta per il deploy!

---

## 🚀 STEP 9: Deploy su Cloudflare Pages (3 minuti)

### Prima volta:

```bash
# Crea il progetto Pages
wrangler pages project create gestionale-agenzia --production-branch main

# Deploy
wrangler pages deploy dist --project-name gestionale-agenzia
```

### Deploy successivi:

```bash
# Solo questo comando
npm run deploy:prod
```

Output:
```
✨ Compiled Worker successfully
🌎 Deploying...
✅ Deployment complete!

🔗 https://gestionale-agenzia.pages.dev
```

---

## 🔐 STEP 10: Configura JWT Secret (2 minuti)

```bash
# Imposta la secret key per JWT
wrangler pages secret put JWT_SECRET --project-name gestionale-agenzia

# Ti chiederà: Enter a secret value:
# Scrivi: my-super-secret-jwt-key-2026
# (o una qualsiasi stringa segreta)
```

✅ **FATTO!** Il gestionale è online!

---

## 🎊 RISULTATO FINALE

Il tuo gestionale è ora accessibile a:

### URL Principale
```
https://gestionale-agenzia.pages.dev
```

### API Health Check
```
https://gestionale-agenzia.pages.dev/api/health
```

### Credenziali Admin
- Email: `admin@agenzia.it`
- Password: `admin123`

---

## 🔄 Aggiornamenti Futuri

Per aggiornare il gestionale dopo modifiche:

```bash
# 1. Fai le tue modifiche al codice
# 2. Commit su git (opzionale)
git add -A
git commit -m "Le mie modifiche"

# 3. Build
npm run build

# 4. Deploy
npm run deploy:prod

# Fatto! In 30 secondi il sito è aggiornato
```

---

## 🎯 Comandi Utili

```bash
# Vedi i tuoi progetti Pages
wrangler pages project list

# Vedi i deploy
wrangler pages deployment list --project-name gestionale-agenzia

# Vedi i database D1
wrangler d1 list

# Query manuale al database
wrangler d1 execute gestionale-agenzia-production --remote --command="SELECT * FROM users"

# Vedi secrets
wrangler pages secret list --project-name gestionale-agenzia

# Aggiungi una secret
wrangler pages secret put NOME_SECRET --project-name gestionale-agenzia

# Cancella una secret
wrangler pages secret delete NOME_SECRET --project-name gestionale-agenzia
```

---

## 🆘 Troubleshooting

### ❌ "Authentication error"
```bash
# Rifai il login
wrangler logout
wrangler login
```

### ❌ "Database not found"
Controlla che il `database_id` in `wrangler.jsonc` sia corretto.

### ❌ "Build failed"
```bash
# Pulisci e rebuilda
rm -rf dist node_modules
npm install
npm run build
```

### ❌ "Pages project already exists"
```bash
# Usa un nome diverso o cancella il vecchio progetto
wrangler pages project delete gestionale-agenzia

# Poi ricrea
wrangler pages project create gestionale-agenzia --production-branch main
```

### ❌ Login non funziona sul sito online
1. Apri la Console del browser (F12)
2. Vai su: `https://gestionale-agenzia.pages.dev/static/debug.html`
3. Testa il login e guarda gli errori
4. Potrebbe essere necessario:
   ```bash
   # Ri-applica le migrations
   wrangler d1 migrations apply gestionale-agenzia-production --remote
   
   # Verifica che ci siano utenti
   wrangler d1 execute gestionale-agenzia-production --remote --command="SELECT * FROM users"
   ```

---

## 📱 Custom Domain (Opzionale)

Se vuoi usare un tuo dominio tipo `gestionale.tuodominio.com`:

1. Vai su: https://dash.cloudflare.com/
2. Aggiungi il tuo dominio a Cloudflare
3. Vai su **Workers & Pages** → **gestionale-agenzia**
4. Clicca su **Custom domains**
5. Clicca **Set up a custom domain**
6. Inserisci: `gestionale.tuodominio.com`
7. Cloudflare configurerà automaticamente il DNS

**GRATIS** e con **HTTPS automatico**!

---

## 💰 Limiti Piano Gratuito

Il piano Free di Cloudflare include:

- ✅ **100.000 richieste al giorno** (Pages)
- ✅ **100 database D1** (5 GB storage totale)
- ✅ **Custom domain** illimitati
- ✅ **HTTPS** automatico
- ✅ **Build illimitati**
- ✅ **Bandwidth illimitato**

Per un gestionale aziendale piccolo/medio, il piano Free è **più che sufficiente**!

---

## 🎓 Risorse Utili

- **Cloudflare Dashboard**: https://dash.cloudflare.com/
- **Documentazione D1**: https://developers.cloudflare.com/d1/
- **Documentazione Pages**: https://developers.cloudflare.com/pages/
- **Wrangler Docs**: https://developers.cloudflare.com/workers/wrangler/
- **Community Discord**: https://discord.cloudflare.com/

---

## ✅ Checklist Finale

Prima di considerare il deploy completo, verifica:

- [ ] Il sito si apre all'URL Cloudflare
- [ ] Il login funziona con admin@agenzia.it / admin123
- [ ] La dashboard mostra i dati
- [ ] Puoi creare un nuovo progetto
- [ ] Puoi creare una task
- [ ] I collaboratori possono fare login
- [ ] La vista Gantt funziona
- [ ] Il carico lavoro si visualizza

---

**🎉 Congratulazioni!** Il tuo gestionale è online e pronto per essere usato!

Se hai problemi, apri un issue su GitHub: https://github.com/doviland/gestionale
