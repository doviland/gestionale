-- Cliente di test
INSERT INTO clients (name, company, email, phone, status, created_by) 
VALUES ('Mario Rossi', 'Rossi SRL', 'mario@rossi.it', '+39 333 1234567', 'active', 1);

-- Progetto di test
INSERT INTO projects (client_id, name, description, area, status, start_date, end_date, created_by) 
VALUES (
    (SELECT id FROM clients WHERE email = 'mario@rossi.it'),
    'Campagna Marketing Q1 2026',
    'Campagna completa con copywriting, video e grafica',
    'copywriting',
    'active',
    '2026-02-01',
    '2026-03-31',
    1
);

-- Task di test con date distribuite
INSERT INTO tasks (project_id, title, description, area, assigned_to, status, priority, due_date, estimated_hours, notes, created_by) VALUES
(
    (SELECT id FROM projects WHERE name = 'Campagna Marketing Q1 2026'),
    'Brief creativo e strategia',
    'Definizione obiettivi e target',
    'copywriting',
    (SELECT id FROM users WHERE email = 'admin@agenzia.it'),
    'completed',
    'urgent',
    '2026-02-05',
    16,
    'Task completata',
    1
),
(
    (SELECT id FROM projects WHERE name = 'Campagna Marketing Q1 2026'),
    'Testi per landing page',
    'Copywriting pagina principale',
    'copywriting',
    (SELECT id FROM users WHERE email = 'admin@agenzia.it'),
    'in_progress',
    'high',
    '2026-02-12',
    24,
    'In lavorazione',
    1
),
(
    (SELECT id FROM projects WHERE name = 'Campagna Marketing Q1 2026'),
    'Script video promozionale',
    'Scrittura script per video 60 secondi',
    'video',
    (SELECT id FROM users WHERE email = 'admin@agenzia.it'),
    'pending',
    'high',
    '2026-02-18',
    16,
    'Da iniziare dopo landing',
    1
),
(
    (SELECT id FROM projects WHERE name = 'Campagna Marketing Q1 2026'),
    'Produzione video',
    'Riprese e montaggio video',
    'video',
    (SELECT id FROM users WHERE email = 'admin@agenzia.it'),
    'pending',
    'medium',
    '2026-02-28',
    40,
    'Dipende da script',
    1
),
(
    (SELECT id FROM projects WHERE name = 'Campagna Marketing Q1 2026'),
    'Design grafico banner ADV',
    'Creazione banner per campagna Google Ads',
    'grafica',
    (SELECT id FROM users WHERE email = 'admin@agenzia.it'),
    'pending',
    'high',
    '2026-03-05',
    16,
    'Multiple sizes',
    1
),
(
    (SELECT id FROM projects WHERE name = 'Campagna Marketing Q1 2026'),
    'Setup campagna Google Ads',
    'Configurazione campagna e budget',
    'adv',
    (SELECT id FROM users WHERE email = 'admin@agenzia.it'),
    'pending',
    'urgent',
    '2026-03-10',
    8,
    'Coordinare con grafica',
    1
),
(
    (SELECT id FROM projects WHERE name = 'Campagna Marketing Q1 2026'),
    'Monitoraggio e ottimizzazione',
    'Analisi risultati e ottimizzazione campagna',
    'adv',
    (SELECT id FROM users WHERE email = 'admin@agenzia.it'),
    'pending',
    'medium',
    '2026-03-25',
    24,
    'Report settimanali',
    1
);
