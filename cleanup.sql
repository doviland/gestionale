-- ========================================
-- SCRIPT PULIZIA DATABASE
-- Elimina tutti i dati di esempio tranne l'admin
-- ========================================

-- Elimina task
DELETE FROM tasks WHERE id > 0;

-- Elimina progetti
DELETE FROM projects WHERE id > 0;

-- Elimina clienti
DELETE FROM clients WHERE id > 0;

-- Elimina template (tabella corretta: project_templates)
DELETE FROM project_templates WHERE id > 0;

-- Elimina ricorrenze
DELETE FROM task_recurrence WHERE id > 0;

-- Elimina activity log
DELETE FROM activity_log WHERE id > 0;

-- Elimina utenti tranne admin (id = 1)
DELETE FROM users WHERE id > 1;

-- Reset autoincrement
-- SQLite usa sqlite_sequence
DELETE FROM sqlite_sequence WHERE name IN ('tasks', 'projects', 'clients', 'project_templates', 'task_recurrence', 'activity_log');
UPDATE sqlite_sequence SET seq = 1 WHERE name = 'users';

-- Verifica
SELECT 'Users rimasti:' as info, COUNT(*) as count FROM users;
SELECT 'Clients rimasti:' as info, COUNT(*) as count FROM clients;
SELECT 'Projects rimasti:' as info, COUNT(*) as count FROM projects;
SELECT 'Tasks rimasti:' as info, COUNT(*) as count FROM tasks;
SELECT 'Templates rimasti:' as info, COUNT(*) as count FROM project_templates;
