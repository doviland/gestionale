# 📊 Gestionale Agenzia - Project Management System

Un sistema completo di gestione progetti per agenzie, con tracking attività, gestione clienti, template riutilizzabili e permessi per area.

## 🌐 URLs

- **Demo Live**: https://3000-iw5m59dn8m2cabpm0afmt-3844e1b6.sandbox.novita.ai
- **API Health**: https://3000-iw5m59dn8m2cabpm0afmt-3844e1b6.sandbox.novita.ai/api/health
- **Debug Login**: https://3000-iw5m59dn8m2cabpm0afmt-3844e1b6.sandbox.novita.ai/static/debug.html
- **GitHub Repository**: https://github.com/doviland/gestionale

## ✨ Funzionalità Principali

### 👨‍💼 Per Amministratori
- ✅ **Dashboard completa** con statistiche in tempo reale
- ✅ **Vista Gantt Overview** - Timeline completa di tutti i progetti con visualizzazione grafica delle task
- ✅ **Gantt Workflow Progetto** - Vista orizzontale dettagliata per singolo progetto con task collegate in sequenza
- ✅ **Carico Lavoro** - Monitora il carico di lavoro di ogni collaboratore con statistiche dettagliate
- ✅ **Gestione clienti** - Crea, modifica, elimina clienti dell'agenzia (CRUD completo)
- ✅ **Gestione progetti** - Crea, modifica, elimina progetti da template o da zero (CRUD completo)
- ✅ **Template riutilizzabili** - Crea, modifica, elimina template di progetto con task predefinite (CRUD completo)
- ✅ **Gestione utenti** - Crea, modifica, elimina collaboratori con permessi per area (CRUD completo)
- ✅ **Gestione task complete** - Crea, modifica, elimina, assegna task con tutti i dettagli (CRUD completo)
- ✅ **Vista completa task** - Monitora tutte le attività dell'agenzia
- ✅ **Activity log** - Storico completo delle attività

### 👥 Per Collaboratori
- ✅ **Dashboard personale** - Vista task assegnate
- ✅ **Le mie task** - Task organizzate per stato (pending, in progress, completed)
- ✅ **Toggle rapido** - Segna task come completate con un click
- ✅ **Permessi per area** - Accesso limitato alle aree di competenza
- ✅ **Filtri avanzati** - Filtra per progetto, cliente, area, stato

### 📊 Visualizzazioni Gantt (NEW!)
- ✅ **Vista Gantt Overview** - Timeline di tutti i progetti attivi con progress bar
- ✅ **Gantt Workflow Progetto** - Vista orizzontale per singolo progetto con:
  - Timeline giorni/settimane personalizzata
  - Barre task colorate per stato (completata/in corso/pending/bloccata)
  - Opacità per priorità
  - Frecce di collegamento tra task in sequenza temporale
  - Tooltip interattivi per modifica rapida
  - Canvas con connessioni curve tra task
- ✅ **Carico Lavoro Utenti** - Vista dettagliata del carico di lavoro per ogni collaboratore
- ✅ **Statistiche progetto** - Percentuale completamento, task scadute, task in corso
- ✅ **Filtri per area** - Filtra i progetti per area di competenza
- ✅ **Timeline dinamica** - Visualizza il flusso di lavoro nei prossimi 90 giorni

### 🎯 Aree Operative
- **📝 Copywriting** - Gestione contenuti testuali e copy
- **🎬 Video** - Produzione e editing video
- **📢 ADV** - Campagne pubblicitarie e advertising
- **🎨 Grafica** - Design e materiali grafici

## 🗄️ Architettura Database

### Entità Principali

1. **Users** - Utenti del sistema (admin e collaboratori)
   - Gestione ruoli (admin/collaborator)
   - Permessi granulari per area
   - Autenticazione JWT

2. **Clients** - Clienti dell'agenzia
   - Informazioni contatto complete
   - Stati (active, inactive, archived)
   - Tracking creazione

3. **Project Templates** - Template riutilizzabili
   - Task predefinite con priorità e stime ore
   - Organizzati per area
   - Riutilizzabili su più progetti

4. **Projects** - Progetti assegnati ai clienti
   - Possibilità di creare da template
   - Tracking date inizio/fine
   - Stati workflow completi
   - Collegamento con client

5. **Tasks** - Attività dei progetti
   - Assegnazione a collaboratori
   - Stati: pending, in_progress, completed, blocked
   - Priorità: low, medium, high, urgent
   - Due date e tracking completamento
   - Note e stime ore

6. **Task Recurrence** - Automazione ricorrenza
   - Frequenze: monthly, quarterly, yearly
   - Replica automatica task
   - Next execution tracking

7. **Activity Log** - Storico attività
   - Tracking completo azioni utenti
   - Entity types multipli
   - Timestamp precisi

## 🛠️ Stack Tecnologico

### Backend
- **Hono** - Web framework lightweight per Cloudflare Workers
- **Cloudflare D1** - Database SQLite distribuito globalmente
- **TypeScript** - Type safety completo
- **JWT Authentication** - Sistema auth sicuro con Web Crypto API
- **bcrypt** - Password hashing

### Frontend
- **Vanilla JavaScript** - Nessuna dipendenza pesante
- **TailwindCSS** - Styling moderno via CDN
- **Font Awesome** - Icone
- **Axios** - HTTP client
- **SPA Architecture** - Single Page Application reattiva

### Infrastructure
- **Cloudflare Pages** - Hosting edge globale
- **Wrangler** - Deployment e development tools
- **PM2** - Process management per development
- **Vite** - Build tool veloce

## 🚀 Setup e Installazione

### 🔐 Credenziali di Test

**Amministratore:**
- Email: `admin@agenzia.it`
- Password: `admin123`

**Collaboratori:**
- Copywriter: `copywriter@agenzia.it` / `password123`
- Video Editor: `video@agenzia.it` / `password123`
- ADV Manager: `adv@agenzia.it` / `password123`
- Graphic Designer: `grafica@agenzia.it` / `password123`

### 🐛 Problemi con il Login?

Se hai problemi con il login, segui questi passi:

1. **Usa la pagina di debug**: https://3000-iw5m59dn8m2cabpm0afmt-3844e1b6.sandbox.novita.ai/static/debug.html
   - Questa pagina testa il login e mostra eventuali errori
   - Controlla la console del browser (F12)
   - Verifica che il token venga salvato correttamente

2. **Pulisci cache del browser**:
   - Chrome/Edge: Ctrl+Shift+Delete → Cancella "Immagini e file in cache"
   - Firefox: Ctrl+Shift+Delete → Cancella "Cache"
   - Poi ricarica con Ctrl+Shift+R (hard refresh)

3. **Usa modalità Incognito**:
   - Apri una finestra privata/incognito
   - Vai all'URL dell'applicazione
   - Prova il login

4. **Verifica LocalStorage**:
   - Apri Console (F12) → scheda Application/Storage
   - Controlla che localStorage contenga il token dopo il login
   - Se non c'è, potrebbe essere un problema di sicurezza del browser

5. **Reset Database Locale** (solo se usi in locale):
   ```bash
   npm run db:reset
   ```

### Prerequisiti
```bash
Node.js >= 18
npm o yarn
```

### Installazione

1. **Clone repository**
```bash
git clone <repository-url>
cd webapp
```

2. **Installa dipendenze**
```bash
npm install
```

3. **Setup database locale**
```bash
# Applica migrations
npm run db:migrate:local

# Carica dati di esempio
npm run db:seed
```

4. **Avvia development server**
```bash
# Build
npm run build

# Start con PM2
pm2 start ecosystem.config.cjs

# O usa npm script
npm run dev:sandbox
```

5. **Accedi all'applicazione**
```
http://localhost:3000
```

### Credenziali di Test

**Amministratore:**
- Email: `admin@agenzia.it`
- Password: `admin123`

**Collaboratori:**
- **Copywriter**: `copywriter@agenzia.it` / `password123`
- **Video Editor**: `video@agenzia.it` / `password123`
- **ADV Manager**: `adv@agenzia.it` / `password123`
- **Graphic Designer**: `grafica@agenzia.it` / `password123`

## 📋 Script NPM Disponibili

```bash
# Development
npm run dev              # Vite dev server (frontend only)
npm run dev:sandbox      # Wrangler dev con D1 (full stack)
npm run build            # Build per production
npm run preview          # Preview build locale

# Database
npm run db:migrate:local # Applica migrations locale
npm run db:migrate:prod  # Applica migrations production
npm run db:seed          # Carica dati seed
npm run db:reset         # Reset completo database locale

# Deployment
npm run deploy           # Deploy su Cloudflare Pages
npm run deploy:prod      # Deploy production specifico

# Utilities
npm run clean-port       # Pulisci porta 3000
npm run cf-typegen       # Genera TypeScript types per bindings
```

## 🔑 API Endpoints

### Authentication
- `POST /api/auth/login` - Login utente
- `GET /api/auth/me` - Ottieni utente corrente
- `POST /api/auth/register` - Registra nuovo utente (admin only)
- `GET /api/auth/users` - Lista utenti (admin only)
- `PUT /api/auth/users/:id` - Aggiorna utente (admin only)

### Clients
- `GET /api/clients` - Lista clienti
- `GET /api/clients/:id` - Dettaglio cliente
- `POST /api/clients` - Crea cliente
- `PUT /api/clients/:id` - Aggiorna cliente
- `DELETE /api/clients/:id` - Elimina cliente (admin only)

### Projects
- `GET /api/projects` - Lista progetti (con filtri)
- `GET /api/projects/:id` - Dettaglio progetto con task
- `POST /api/projects` - Crea progetto (anche da template)
- `PUT /api/projects/:id` - Aggiorna progetto
- `DELETE /api/projects/:id` - Elimina progetto (admin only)
- `POST /api/projects/:id/recurrence` - Configura ricorrenza

### Tasks
- `GET /api/tasks` - Lista task (con filtri)
- `GET /api/tasks/my` - Le mie task
- `GET /api/tasks/:id` - Dettaglio task
- `POST /api/tasks` - Crea task
- `PUT /api/tasks/:id` - Aggiorna task
- `DELETE /api/tasks/:id` - Elimina task
- `POST /api/tasks/:id/toggle` - Toggle completamento

### Templates
- `GET /api/templates` - Lista template
- `GET /api/templates/:id` - Dettaglio template
- `POST /api/templates` - Crea template (admin only)
- `PUT /api/templates/:id` - Aggiorna template (admin only)
- `DELETE /api/templates/:id` - Elimina template (admin only)

### Dashboard
- `GET /api/dashboard/stats` - Statistiche dashboard
- `GET /api/dashboard/monthly-activities` - Attività mensili
- `GET /api/dashboard/my-tasks-summary` - Riepilogo task personali
- `GET /api/dashboard/projects-by-client` - Progetti per cliente

### Gantt & Workload (NEW!)
- `GET /api/gantt/overview` - Vista overview di tutti i progetti con timeline (admin only)
- `GET /api/gantt/workload` - Carico lavoro di tutti gli utenti (admin only)
- `GET /api/gantt/project/:id` - Dati Gantt per un progetto specifico
- `GET /api/gantt/user/:userId` - Vista Gantt per un utente specifico

## 🎨 Struttura Progetto

```
webapp/
├── src/
│   ├── index.tsx              # Main application entry
│   ├── types/
│   │   └── index.ts           # TypeScript types & interfaces
│   ├── middleware/
│   │   └── auth.ts            # Auth middleware (JWT, permissions)
│   ├── utils/
│   │   └── auth.ts            # Auth utilities (bcrypt, JWT, dates)
│   └── routes/
│       ├── auth.ts            # Authentication routes
│       ├── clients.ts         # Client management routes
│       ├── projects.ts        # Project management routes
│       ├── tasks.ts           # Task management routes
│       ├── templates.ts       # Template management routes
│       └── dashboard.ts       # Dashboard & stats routes
│
├── public/
│   └── static/
│       └── app.js             # Frontend SPA application
│
├── migrations/
│   └── 0001_initial_schema.sql   # Database schema
│
├── seed.sql                   # Seed data
├── ecosystem.config.cjs       # PM2 configuration
├── wrangler.jsonc             # Cloudflare configuration
├── vite.config.ts             # Vite build configuration
├── tsconfig.json              # TypeScript configuration
└── package.json               # Dependencies & scripts
```

## 🔐 Sistema Permessi

### Ruoli
- **Admin**: Accesso completo a tutte le funzionalità
- **Collaborator**: Accesso limitato in base ai permessi area

### Permessi per Area
I collaboratori hanno permessi granulari per ogni area:
```typescript
{
  copywriting: boolean,
  video: boolean,
  adv: boolean,
  grafica: boolean
}
```

Un collaboratore può vedere e gestire solo:
- Progetti della propria area
- Task della propria area
- Clienti relativi ai propri progetti

## 📊 Modelli Dati Chiave

### User Permissions
```json
{
  "copywriting": true,
  "video": false,
  "adv": true,
  "grafica": false
}
```

### Task Template
```json
{
  "title": "Piano editoriale mensile",
  "description": "Creare piano con 20 post",
  "priority": "high",
  "estimated_hours": 4
}
```

### Project with Tasks
```json
{
  "id": 1,
  "name": "Social Media - Gennaio 2026",
  "client_id": 1,
  "area": "copywriting",
  "status": "active",
  "tasks": [...]
}
```

## 🚀 Deployment su Cloudflare Pages

### Setup Iniziale

1. **Crea database D1 production**
```bash
npx wrangler d1 create webapp-production
```

2. **Aggiorna database_id in wrangler.jsonc**
```jsonc
{
  "d1_databases": [{
    "binding": "DB",
    "database_name": "webapp-production",
    "database_id": "your-production-id-here"
  }]
}
```

3. **Applica migrations su production**
```bash
npm run db:migrate:prod
```

4. **Crea progetto Cloudflare Pages**
```bash
npx wrangler pages project create webapp --production-branch main
```

5. **Deploy**
```bash
npm run deploy:prod
```

6. **Configura secrets**
```bash
npx wrangler pages secret put JWT_SECRET --project-name webapp
```

## 📈 Funzionalità Future (Roadmap)

- [ ] Export/Import progetti e dati
- [ ] Notifiche email per task in scadenza
- [ ] Grafici avanzati con Chart.js
- [ ] File upload per progetti (Cloudflare R2)
- [ ] Calendario interattivo per deadline
- [ ] Commenti su task
- [ ] Tag personalizzabili
- [ ] API webhooks per integrazioni
- [ ] Mobile app PWA
- [ ] Multi-language support

## 🐛 Troubleshooting

### Errore "Database not found"
```bash
# Ricrea database locale
npm run db:reset
```

### Porta 3000 già in uso
```bash
# Pulisci porta
npm run clean-port
# O manualmente
fuser -k 3000/tcp
```

### Build fallisce
```bash
# Pulisci e rebuilda
rm -rf dist .wrangler node_modules
npm install
npm run build
```

### PM2 non risponde
```bash
# Restart PM2
pm2 delete all
pm2 start ecosystem.config.cjs
```

## 📝 Note Tecniche

### Cloudflare Workers Limitations
- CPU time: 10ms per request (free), 30ms (paid)
- Memoria: 128MB per request
- Nessun accesso a filesystem runtime
- Solo Web APIs standard (no Node.js APIs)

### D1 Database
- SQLite distribuito globally
- Eventual consistency
- Ottimo per read-heavy workloads
- Migration-based schema management

### JWT Implementation
- Custom implementation usando Web Crypto API
- Token expiry: 7 giorni
- Stored in localStorage (client-side)
- Bearer token in Authorization header

## 👨‍💻 Autore

Sviluppato con ❤️ usando Cloudflare Workers, Hono e D1.

## 📄 Licenza

MIT License - Usa liberamente per i tuoi progetti!

---

**Status**: ✅ Produzione Ready
**Ultimo Aggiornamento**: 2026-01-29
**Versione**: 1.0.0
