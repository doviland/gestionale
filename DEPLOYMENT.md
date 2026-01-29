# 🚀 GUIDA COMPLETA DEPLOYMENT & INSTALLAZIONE

## 📋 INDICE
1. [Usare sul Tuo PC (Locale)](#1-usare-sul-tuo-pc-locale)
2. [Deploy su Cloudflare Pages (Online)](#2-deploy-su-cloudflare-pages-online)
3. [Risoluzione Problemi Login](#3-risoluzione-problemi-login)

---

## 1️⃣ USARE SUL TUO PC (LOCALE)

### **Requisiti**
- Node.js 18 o superiore ([Download](https://nodejs.org/))
- Git ([Download](https://git-scm.com/))

### **Installazione Passo-Passo**

#### **Passo 1: Scarica il Progetto**

Opzione A - Da questa sandbox (ZIP):
```bash
# Scarica il progetto come ZIP
# Estrai in una cartella sul tuo PC (es: C:\progetti\webapp)
```

Opzione B - Da GitHub (se hai pushato):
```bash
git clone <tuo-repository-url>
cd webapp
```

#### **Passo 2: Installa le Dipendenze**

Apri il terminale nella cartella del progetto:

**Windows (PowerShell o CMD):**
```bash
cd C:\progetti\webapp
npm install
```

**Mac/Linux:**
```bash
cd ~/progetti/webapp
npm install
```

#### **Passo 3: Setup Database Locale**

```bash
# Crea e popola il database
npm run db:migrate:local
npm run db:seed
```

#### **Passo 4: Avvia il Server**

```bash
# Build
npm run build

# Avvia con wrangler (consigliato)
npx wrangler pages dev dist --d1=webapp-production --local --port 3000
```

#### **Passo 5: Apri nel Browser**

Apri: **http://localhost:3000**

**Credenziali:**
- Email: `admin@agenzia.it`
- Password: `admin123`

### **Comandi Utili (Locale)**

```bash
# Riavvia il server (se modifichi codice)
# Premi Ctrl+C per fermare, poi:
npm run build
npx wrangler pages dev dist --d1=webapp-production --local --port 3000

# Reset database (se vuoi ricominciare)
npm run db:reset

# Vedere tutti i comandi disponibili
npm run
```

---

## 2️⃣ DEPLOY SU CLOUDFLARE PAGES (ONLINE)

### **Vantaggi Cloudflare Pages**
- ✅ **GRATIS** (500.000 richieste/mese)
- ✅ **Veloce** (edge network globale)
- ✅ **HTTPS automatico**
- ✅ **Deploy automatici** da GitHub
- ✅ **Database D1 incluso**

### **Passo 1: Crea Account Cloudflare**

1. Vai su [https://dash.cloudflare.com/sign-up](https://dash.cloudflare.com/sign-up)
2. Registrati gratuitamente
3. Verifica email

### **Passo 2: Installa Wrangler CLI**

Sul tuo PC:
```bash
npm install -g wrangler
```

### **Passo 3: Login a Cloudflare**

```bash
wrangler login
```

Si aprirà il browser, autorizza l'accesso.

### **Passo 4: Crea Database D1 Production**

```bash
cd /percorso/tuo/progetto/webapp
npx wrangler d1 create webapp-production
```

**IMPORTANTE:** Copia il `database_id` che appare (es: `abc123-def456-...`)

### **Passo 5: Aggiorna wrangler.jsonc**

Apri `wrangler.jsonc` e sostituisci:

```jsonc
{
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "webapp-production",
      "database_id": "INCOLLA-QUI-IL-TUO-DATABASE-ID"
    }
  ]
}
```

### **Passo 6: Applica Migrations al Database Production**

```bash
npx wrangler d1 migrations apply webapp-production
```

Conferma con `y`.

### **Passo 7: Carica Dati Iniziali**

```bash
npx wrangler d1 execute webapp-production --file=./seed.sql
```

### **Passo 8: Crea Progetto Cloudflare Pages**

```bash
npx wrangler pages project create webapp --production-branch main
```

### **Passo 9: Build e Deploy**

```bash
npm run build
npx wrangler pages deploy dist --project-name webapp
```

### **Passo 10: Configura JWT Secret**

```bash
npx wrangler pages secret put JWT_SECRET --project-name webapp
```

Quando chiede il valore, incolla: `your-super-secret-jwt-key-change-in-production-123456789`

### **✅ FATTO!**

Riceverai un URL tipo:
```
https://webapp-abc.pages.dev
```

Questo è il tuo gestionale **ONLINE e PUBBLICO**!

### **Aggiornamenti Futuri**

Quando modifichi il codice:
```bash
npm run build
npx wrangler pages deploy dist --project-name webapp
```

---

## 3️⃣ RISOLUZIONE PROBLEMI LOGIN

### **Problema: "Login non funziona"**

#### **Soluzione 1: Pulisci Cache Browser**

**Chrome/Edge:**
1. Apri DevTools (F12)
2. Tab "Application"
3. Click "Storage" → "Clear site data"
4. Ricarica pagina (Ctrl+Shift+R)

**Firefox:**
1. Apri DevTools (F12)
2. Tab "Storage"
3. Click destro su "localStorage" → "Delete All"
4. Ricarica pagina (Ctrl+Shift+R)

**Safari:**
1. Menu Develop → Empty Caches
2. Ricarica pagina (Cmd+Shift+R)

#### **Soluzione 2: Modalità Incognito**

Apri una **finestra privata/incognito** e prova di nuovo.

#### **Soluzione 3: Usa la Pagina Test**

Apri: `http://localhost:3000/static/test.html`

Questa pagina bypassa qualsiasi cache.

#### **Soluzione 4: Verifica Password Database**

```bash
cd /percorso/progetto/webapp
npm run db:reset
```

Questo ricarica le password corrette.

#### **Soluzione 5: Controlla Console Browser**

1. Apri DevTools (F12)
2. Tab "Console"
3. Prova login
4. Copia errori e mandameli

### **Credenziali Corrette**

```
Admin:
  Email: admin@agenzia.it
  Password: admin123

Collaboratori:
  copywriter@agenzia.it / password123
  video@agenzia.it / password123
  adv@agenzia.it / password123
  grafica@agenzia.it / password123
```

---

## 🆘 TROUBLESHOOTING COMUNE

### **Errore: "Port 3000 already in use"**

**Windows:**
```bash
netstat -ano | findstr :3000
taskkill /PID <numero-pid> /F
```

**Mac/Linux:**
```bash
lsof -i :3000
kill -9 <PID>
```

### **Errore: "Database not found"**

```bash
npm run db:reset
```

### **Errore: "Module not found"**

```bash
rm -rf node_modules package-lock.json
npm install
```

### **Errore: "Wrangler command not found"**

```bash
npm install -g wrangler
```

---

## 📞 SUPPORTO

Se hai problemi:
1. Controlla la console browser (F12)
2. Copia il messaggio di errore
3. Mandamelo e ti aiuto subito!

---

## 🎯 RIEPILOGO VELOCE

### **Per Usare Locale:**
```bash
npm install
npm run db:migrate:local
npm run db:seed
npm run build
npx wrangler pages dev dist --d1=webapp-production --local --port 3000
```

### **Per Deploy Online:**
```bash
wrangler login
npx wrangler d1 create webapp-production
# Copia database_id in wrangler.jsonc
npx wrangler d1 migrations apply webapp-production
npx wrangler d1 execute webapp-production --file=./seed.sql
npm run build
npx wrangler pages deploy dist --project-name webapp
npx wrangler pages secret put JWT_SECRET --project-name webapp
```

### **URL Importanti:**
- **Locale**: http://localhost:3000
- **Test Login**: http://localhost:3000/static/test.html
- **Cloudflare Dashboard**: https://dash.cloudflare.com

---

**Fatto! Scegli l'opzione che preferisci e segui i passaggi.** 🚀
