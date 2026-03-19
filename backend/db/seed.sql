-- ============================================================================
-- Seed inicial para testes locais
-- Senha padrao para todos os usuarios: Nubank@123
-- ============================================================================

INSERT INTO employee (name, email, chapter, squad, hire_date, role)
VALUES (
  'Luana Gualberto',
  'luana.gualberto@nubank.com.br',
  'Controllership',
  'Record to Report',
  DATE '2022-03-01',
  'ADMIN'
);

INSERT INTO employee (name, email, chapter, squad, hire_date, manager_id, role)
SELECT
  'Rafael Oliveira',
  'rafael.oliveira@nubank.com.br',
  'Controllership',
  'Record to Report',
  DATE '2023-01-10',
  e.id,
  'EMPLOYEE'
FROM employee e
WHERE e.email = 'luana.gualberto@nubank.com.br';

INSERT INTO app_user (employee_id, email, password_hash, role, is_active)
SELECT
  id,
  email,
  '$2b$10$omKHiQyBmCqhjV9f02kyq.svgMWbl8F0Wo0bTRDudlLbM7urLyHDG',
  role,
  1
FROM employee
WHERE email IN (
  'luana.gualberto@nubank.com.br',
  'rafael.oliveira@nubank.com.br'
);

INSERT INTO vacation_balance (employee_id, year, total_days, used_days)
SELECT id, EXTRACT(YEAR FROM SYSDATE), 30, 5
FROM employee
WHERE email = 'luana.gualberto@nubank.com.br';

INSERT INTO vacation_balance (employee_id, year, total_days, used_days)
SELECT id, EXTRACT(YEAR FROM SYSDATE), 30, 10
FROM employee
WHERE email = 'rafael.oliveira@nubank.com.br';

COMMIT;
