# 🚀 GUIDA SUPER SEMPLICE - Cloudflare Pages

## ❓ Cos'è Cloudflare Pages?
È un servizio **GRATUITO** di Cloudflare che ti permette di mettere il tuo gestionale **ONLINE** con un URL tipo:
```
https://tuo-gestionale.pages.dev
```

**Vantaggi:**
- ✅ 100% Gratis
- ✅ HTTPS automatico (sicuro)
- ✅ Veloce in tutto il mondo
- ✅ Database incluso
- ✅ Zero server da gestire

---

## 📝 COSA TI SERVE

1. **Un account Cloudflare** (gratuito)
2. **10 minuti di tempo**
3. **Il progetto scaricato** sul tuo PC

---

## 🎯 PASSO 1: Crea Account Cloudflare

1. Vai su: https://dash.cloudflare.com/sign-up
2. Inserisci la tua email
3. Scegli una password
4. Conferma l'email che ricevi
5. Fatto!

---

## 🔑 PASSO 2: Ottieni la Chiave API

1. Vai su: https://dash.cloudflare.com/profile/api-tokens
2. Clicca sul pulsante blu **"Create Token"**
3. Cerca **"Edit Cloudflare Workers"** e clicca **"Use template"**
4. Scorri fino in fondo e clicca **"Continue to summary"**
5. Clicca **"Create Token"**
6. **COPIA IL TOKEN** (appare solo una volta!)
   - Sarà tipo: `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
7. **SALVALO** in un posto sicuro (tipo in un file sul desktop)

---

## 💻 PASSO 3: Installa Wrangler

Apri il **Terminale** (o **PowerShell** su Windows):

### Su Windows:
1. Premi **Win + X**
2. Scegli **"Windows PowerShell"** o **"Terminale"**

### Su Mac:
1. Premi **Cmd + Spazio**
2. Scrivi **"Terminal"**
3. Premi Invio

### Digita questo comando:
```bash
npm install -g wrangler
```

Aspetta che finisca (ci vogliono 1-2 minuti).

---

## 🔐 PASSO 4: Fai Login

Nel terminale, digita:

```bash
wrangler login
```

Si aprirà il browser → Clicca **"Allow"** → Chiudi il browser

**OPPURE** (se il browser non si apre):

```bash
export CLOUDFLARE_API_TOKEN=incolla-qui-il-token-che-hai-copiato
```

Per verificare che funziona:
```bash
wrangler whoami
```

Dovresti vedere il tuo account!

---

## 📂 PASSO 5: Vai nella Cartella del Progetto

Nel terminale, vai dove hai scaricato il gestionale:

### Windows:
```bash
cd C:\Downloads\gestionale
```
(Modifica il percorso se hai estratto in un'altra cartella)

### Mac:
```bash
cd ~/Downloads/gestionale
```

---

## 🗄️ PASSO 6: Crea il Database

Digita questo comando:

```bash
wrangler d1 create gestionale-production
```

Vedrai un output tipo:
```
✅ Successfully created DB 'gestionale-production'
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

**COPIA IL `database_id`** (le X sopra)

---

## ⚙️ PASSO 7: Modifica Configurazione

1. Apri il file **`wrangler.jsonc`** (nella cartella del progetto)
2. Trova questa parte:
```json
"d1_databases": [
  {
    "binding": "DB",
    "database_name": "gestionale-production",
    "database_id": "METTI_QUI_IL_TUO_DATABASE_ID"
  }
]
```
3. Sostituisci `"METTI_QUI_IL_TUO_DATABASE_ID"` con il database_id che hai copiato
4. **Salva il file**

---

## 📊 PASSO 8: Carica il Database

Digita:

```bash
wrangler d1 migrations apply gestionale-production --remote
```

Vedrai:
```
✅ 1 migration applied
```

---

## 🏗️ PASSO 9: Build

Digita:

```bash
npm install
npm run build
```

Aspetta che finisca (1-2 minuti)

---

## 🚀 PASSO 10: DEPLOY!

Digita:

```bash
wrangler pages deploy dist --project-name gestionale-agenzia
```

**LA PRIMA VOLTA** ti chiederà di creare il progetto → premi **Y** (Yes)

Aspetta 1-2 minuti...

Vedrai:
```
✅ Deployment complete!
🔗 https://gestionale-agenzia.pages.dev
```

**COPIA L'URL** → Il tuo gestionale è ONLINE! 🎉

---

## 🔐 PASSO 11: Imposta la Chiave Segreta

Digita:

```bash
wrangler pages secret put JWT_SECRET --project-name gestionale-agenzia
```

Ti chiederà: **"Enter a secret value:"**

Scrivi: `my-super-secret-key-2026`

Premi Invio.

---

## ✅ FATTO!

Il tuo gestionale è online all'indirizzo:

```
https://gestionale-agenzia.pages.dev
```

**Credenziali:**
- Email: admin@agenzia.it
- Password: admin123

---

## 🔄 AGGIORNAMENTI FUTURI

Quando fai modifiche al codice:

```bash
npm run build
wrangler pages deploy dist --project-name gestionale-agenzia
```

In 30 secondi il sito è aggiornato!

---

## 🆘 PROBLEMI COMUNI

### ❌ "command not found: wrangler"
Soluzione:
```bash
npm install -g wrangler
```

### ❌ "Authentication error"
Soluzione:
```bash
wrangler logout
wrangler login
```

### ❌ "Database not found"
Verifica che il `database_id` in `wrangler.jsonc` sia corretto.

### ❌ Il login non funziona
1. Vai su: https://tuo-sito.pages.dev/static/debug.html
2. Prova il login lì
3. Se non funziona:
```bash
wrangler d1 migrations apply gestionale-production --remote --force
```

---

## 💰 QUANTO COSTA?

**ZERO €!** 

Il piano gratuito di Cloudflare include:
- 100.000 richieste al giorno
- Database D1 (5 GB)
- Certificato HTTPS
- Bandwidth illimitato
- Custom domain

Per un gestionale aziendale è **più che sufficiente**!

---

## 📞 SERVE AIUTO?

1. **Problemi tecnici:** Apri issue su GitHub
2. **Debug login:** Usa /static/debug.html
3. **Console errori:** Premi F12 nel browser

---

**Fatto! 🎉 Il tuo gestionale è online e pronto all'uso!**
