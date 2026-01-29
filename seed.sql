-- ========================================
-- SEED DATA - Dati iniziali per testing
-- ========================================

-- Admin user (password: admin123)
-- Hash generato con bcrypt
INSERT INTO users (email, password_hash, name, role, permissions, is_active) VALUES 
('admin@agenzia.it', '$2b$10$v7r727Mn7jNPiyvB62ENfOsy/0gZ6iumXX5klnNFRDsKGdftNvYYq', 'Amministratore', 'admin', '{"copywriting": true, "video": true, "adv": true, "grafica": true}', 1);

-- Collaboratori di esempio (password: password123)
INSERT INTO users (email, password_hash, name, role, permissions, is_active) VALUES 
('copywriter@agenzia.it', '$2b$10$P34D/zq/5P0XKHgnLFpAgOnicXla3obWg8y6vHHXWL4PllkyA99Te', 'Mario Rossi', 'collaborator', '{"copywriting": true, "video": false, "adv": false, "grafica": false}', 1),
('video@agenzia.it', '$2b$10$P34D/zq/5P0XKHgnLFpAgOnicXla3obWg8y6vHHXWL4PllkyA99Te', 'Laura Bianchi', 'collaborator', '{"copywriting": false, "video": true, "adv": false, "grafica": false}', 1),
('adv@agenzia.it', '$2b$10$P34D/zq/5P0XKHgnLFpAgOnicXla3obWg8y6vHHXWL4PllkyA99Te', 'Giuseppe Verdi', 'collaborator', '{"copywriting": false, "video": false, "adv": true, "grafica": false}', 1),
('grafica@agenzia.it', '$2b$10$P34D/zq/5P0XKHgnLFpAgOnicXla3obWg8y6vHHXWL4PllkyA99Te', 'Sofia Russo', 'collaborator', '{"copywriting": false, "video": false, "adv": false, "grafica": true}', 1);

-- Clienti di esempio
INSERT INTO clients (name, email, phone, company, notes, status, created_by) VALUES 
('Azienda Tech SRL', 'info@aziendatech.it', '+39 02 1234567', 'Azienda Tech SRL', 'Cliente importante nel settore tecnologico', 'active', 1),
('Fashion Store', 'contact@fashionstore.it', '+39 06 7654321', 'Fashion Store SpA', 'E-commerce moda', 'active', 1),
('Ristorante Da Mario', 'mario@ristorantemario.it', '+39 051 9876543', 'Ristorante Da Mario', 'Ristorante locale, social media', 'active', 1);

-- Template di progetto: Social Media Management
INSERT INTO project_templates (name, description, area, default_tasks, created_by) VALUES 
('Social Media Management - Mensile', 'Gestione completa social media con piano editoriale mensile', 'copywriting', 
'[
  {"title": "Piano editoriale mensile", "description": "Creare piano editoriale con 20 post", "priority": "high", "estimated_hours": 4},
  {"title": "Scrittura copy post", "description": "Scrivere testi per tutti i post programmati", "priority": "high", "estimated_hours": 8},
  {"title": "Ricerca hashtag", "description": "Ricerca e ottimizzazione hashtag per ogni post", "priority": "medium", "estimated_hours": 2},
  {"title": "Revisione e approvazione", "description": "Revisione finale e invio al cliente", "priority": "high", "estimated_hours": 2}
]', 1);

-- Template: Campagna Video
INSERT INTO project_templates (name, description, area, default_tasks, created_by) VALUES 
('Campagna Video Promozionale', 'Produzione video promozionale completo', 'video', 
'[
  {"title": "Briefing e sceneggiatura", "description": "Meeting con cliente e stesura sceneggiatura", "priority": "high", "estimated_hours": 6},
  {"title": "Riprese video", "description": "Sessione di riprese on location", "priority": "high", "estimated_hours": 8},
  {"title": "Montaggio e post-produzione", "description": "Editing video, color grading, audio", "priority": "high", "estimated_hours": 12},
  {"title": "Revisioni", "description": "Implementazione modifiche richieste dal cliente", "priority": "medium", "estimated_hours": 4}
]', 1);

-- Template: Campagna ADV
INSERT INTO project_templates (name, description, area, default_tasks, created_by) VALUES 
('Campagna ADV Meta/Google', 'Gestione campagne pubblicitarie digital', 'adv', 
'[
  {"title": "Strategia e targeting", "description": "Definizione strategia, obiettivi e pubblico", "priority": "high", "estimated_hours": 4},
  {"title": "Creazione annunci", "description": "Preparazione creatività e copy annunci", "priority": "high", "estimated_hours": 6},
  {"title": "Setup campagne", "description": "Configurazione campagne su piattaforme", "priority": "high", "estimated_hours": 3},
  {"title": "Monitoraggio settimanale", "description": "Analisi performance e ottimizzazione", "priority": "high", "estimated_hours": 4},
  {"title": "Report mensile", "description": "Report completo con KPI e suggerimenti", "priority": "medium", "estimated_hours": 3}
]', 1);

-- Template: Branding e Grafica
INSERT INTO project_templates (name, description, area, default_tasks, created_by) VALUES 
('Branding Completo', 'Sviluppo identità visiva completa', 'grafica', 
'[
  {"title": "Ricerca e moodboard", "description": "Ricerca competitors e creazione moodboard", "priority": "high", "estimated_hours": 6},
  {"title": "Concept logo", "description": "Sviluppo 3 proposte logo", "priority": "high", "estimated_hours": 8},
  {"title": "Palette colori e font", "description": "Definizione palette colori e tipografia", "priority": "medium", "estimated_hours": 3},
  {"title": "Brand guidelines", "description": "Creazione manuale d''uso del brand", "priority": "medium", "estimated_hours": 6},
  {"title": "Mockup e presentazione", "description": "Applicazione logo su mockup e presentazione finale", "priority": "high", "estimated_hours": 4}
]', 1);

-- Progetto esempio: Social Media per Azienda Tech
INSERT INTO projects (client_id, template_id, name, description, area, status, start_date, end_date, created_by) VALUES 
(1, 1, 'Social Media - Gennaio 2026', 'Gestione social media per il mese di gennaio', 'copywriting', 'active', '2026-01-01', '2026-01-31', 1);

-- Task del progetto (generate dal template)
INSERT INTO tasks (project_id, title, description, area, assigned_to, status, priority, due_date, created_by) VALUES 
(1, 'Piano editoriale mensile', 'Creare piano editoriale con 20 post', 'copywriting', 2, 'completed', 'high', '2026-01-05', 1),
(1, 'Scrittura copy post', 'Scrivere testi per tutti i post programmati', 'copywriting', 2, 'in_progress', 'high', '2026-01-15', 1),
(1, 'Ricerca hashtag', 'Ricerca e ottimizzazione hashtag per ogni post', 'copywriting', 2, 'pending', 'medium', '2026-01-20', 1),
(1, 'Revisione e approvazione', 'Revisione finale e invio al cliente', 'copywriting', 1, 'pending', 'high', '2026-01-28', 1);

-- Progetto esempio: Video per Fashion Store
INSERT INTO projects (client_id, template_id, name, description, area, status, start_date, end_date, created_by) VALUES 
(2, 2, 'Video Collezione Primavera 2026', 'Video promozionale nuova collezione', 'video', 'active', '2026-01-15', '2026-02-28', 1);

INSERT INTO tasks (project_id, title, description, area, assigned_to, status, priority, due_date, created_by) VALUES 
(2, 'Briefing e sceneggiatura', 'Meeting con cliente e stesura sceneggiatura', 'video', 3, 'completed', 'high', '2026-01-20', 1),
(2, 'Riprese video', 'Sessione di riprese on location', 'video', 3, 'in_progress', 'high', '2026-01-28', 1),
(2, 'Montaggio e post-produzione', 'Editing video, color grading, audio', 'video', 3, 'pending', 'high', '2026-02-10', 1),
(2, 'Revisioni', 'Implementazione modifiche richieste dal cliente', 'video', 3, 'pending', 'medium', '2026-02-25', 1);

-- Ricorrenza mensile per Social Media Azienda Tech
INSERT INTO task_recurrence (project_id, frequency, next_execution_date, is_active) VALUES 
(1, 'monthly', '2026-02-01', 1);

-- Activity log di esempio
INSERT INTO activity_log (user_id, entity_type, entity_id, action, details) VALUES 
(1, 'client', 1, 'created', 'Creato nuovo cliente: Azienda Tech SRL'),
(1, 'project', 1, 'created', 'Creato progetto: Social Media - Gennaio 2026'),
(2, 'task', 1, 'completed', 'Completato piano editoriale mensile'),
(1, 'project', 2, 'created', 'Creato progetto: Video Collezione Primavera 2026');
