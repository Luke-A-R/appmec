/*
  # Dados Iniciais para o Sistema

  Inserção de dados de exemplo para demonstração do sistema
*/

-- Inserir clientes de exemplo
INSERT INTO clients (name, email, phone, notes) VALUES
('Ana Costa', 'ana.costa@email.com', '(11) 99999-1111', 'Cliente VIP - Prefere agendamentos pela manhã'),
('Carlos Lima', 'carlos.lima@email.com', '(11) 99999-2222', 'Proprietário de carro clássico - Cuidados especiais'),
('Mariana Alves', 'mariana.alves@email.com', '(11) 99999-3333', 'Cliente corporativo'),
('João Santos', 'joao.santos@email.com', '(11) 99999-4444', 'Entusiasta de carros esportivos'),
('Marina Silva', 'marina.silva@email.com', '(11) 99999-5555', 'Cliente regular - Manutenção preventiva');

-- Inserir veículos
INSERT INTO vehicles (client_id, brand, model, year, color, license_plate) VALUES
((SELECT id FROM clients WHERE email = 'ana.costa@email.com'), 'BMW', 'M5', 2016, 'Preto', 'ABC-1234'),
((SELECT id FROM clients WHERE email = 'carlos.lima@email.com'), 'Ford', 'Mustang', 1967, 'Vermelho', 'DEF-5678'),
((SELECT id FROM clients WHERE email = 'mariana.alves@email.com'), 'Porsche', '911 Carrera', 2020, 'Branco', 'GHI-9012'),
((SELECT id FROM clients WHERE email = 'joao.santos@email.com'), 'Chevrolet', 'Camaro SS', 2019, 'Amarelo', 'JKL-3456'),
((SELECT id FROM clients WHERE email = 'marina.silva@email.com'), 'Audi', 'RS6 Avant', 2021, 'Cinza', 'MNO-7890');

-- Inserir peças no catálogo
INSERT INTO parts (name, category, brand, part_number, description, current_stock, min_stock, max_stock, unit_price, supplier, location) VALUES
('Filtro de Óleo', 'Filtros', 'Mann Filter', 'W712/75', 'Filtro de óleo para motores BMW', 15, 5, 50, 45.90, 'AutoPeças Brasil', 'Estante A-1'),
('Pastilha de Freio Dianteira', 'Freios', 'Bosch', 'BP1234', 'Pastilha de freio cerâmica premium', 3, 5, 30, 120.00, 'Bosch Distribuidora', 'Estante B-2'),
('Óleo Motor 5W30', 'Lubrificantes', 'Castrol', 'GTX-5W30-1L', 'Óleo sintético premium 1L', 0, 10, 100, 35.50, 'Castrol Brasil', 'Estante C-1'),
('Vela de Ignição', 'Motor', 'NGK', 'BKR6E', 'Vela de ignição iridium', 24, 8, 40, 18.90, 'NGK do Brasil', 'Estante A-3'),
('Correia Dentada', 'Motor', 'Gates', 'T43127', 'Correia dentada para motores VW/Audi', 7, 3, 20, 89.90, 'Gates Brasil', 'Estante B-1'),
('Disco de Freio', 'Freios', 'Brembo', 'BR-09.5834.11', 'Disco de freio ventilado 280mm', 8, 4, 25, 180.00, 'Brembo Brasil', 'Estante B-3'),
('Filtro de Ar', 'Filtros', 'K&N', 'KN-33-2865', 'Filtro de ar esportivo lavável', 12, 6, 30, 95.00, 'K&N Performance', 'Estante A-2'),
('Amortecedor Dianteiro', 'Suspensão', 'Monroe', 'MR-G7392', 'Amortecedor a gás pressurizado', 4, 2, 15, 250.00, 'Monroe Brasil', 'Estante D-1'),
('Bateria 60Ah', 'Elétrica', 'Moura', 'M60GD', 'Bateria automotiva 60Ah livre manutenção', 6, 3, 20, 320.00, 'Moura Baterias', 'Estante E-1'),
('Pneu 225/45R17', 'Pneus', 'Michelin', 'PILOT-SPORT-4', 'Pneu esportivo 225/45R17', 16, 8, 40, 450.00, 'Michelin Brasil', 'Estante F-1');

-- Inserir projetos
INSERT INTO projects (client_id, vehicle_id, title, description, service_type, status, priority, start_date, estimated_completion, estimated_cost, actual_cost, notes) VALUES
((SELECT id FROM clients WHERE email = 'ana.costa@email.com'), 
 (SELECT id FROM vehicles WHERE license_plate = 'ABC-1234'), 
 'Detalhamento Premium Completo', 
 'Serviço completo de detalhamento incluindo lavagem, clay bar, polimento e enceramento', 
 'Detalhamento', 
 'in-progress', 
 'high', 
 '2024-01-10', 
 '2024-01-25', 
 2500.00, 
 1800.00,
 'Cliente solicitou atenção especial no interior de couro'),

((SELECT id FROM clients WHERE email = 'carlos.lima@email.com'), 
 (SELECT id FROM vehicles WHERE license_plate = 'DEF-5678'), 
 'Restauração Interior Clássico', 
 'Restauração completa do interior do Mustang 1967', 
 'Restauração', 
 'in-progress', 
 'medium', 
 '2024-01-05', 
 '2024-02-15', 
 8500.00, 
 3200.00,
 'Peças originais quando possível'),

((SELECT id FROM clients WHERE email = 'mariana.alves@email.com'), 
 (SELECT id FROM vehicles WHERE license_plate = 'GHI-9012'), 
 'Proteção Cerâmica Premium', 
 'Aplicação de coating cerâmico 9H com garantia de 5 anos', 
 'Proteção', 
 'completed', 
 'high', 
 '2024-01-01', 
 '2024-01-08', 
 3200.00, 
 3200.00,
 'Projeto concluído com sucesso');

-- Inserir etapas dos projetos
INSERT INTO project_steps (project_id, name, description, step_order, completed, start_date, completed_date, estimated_hours, actual_hours, responsible, notes) VALUES
-- Projeto Ana Costa
((SELECT id FROM projects WHERE title = 'Detalhamento Premium Completo'), 'Inspeção Inicial', 'Avaliação completa do estado do veículo', 1, true, '2024-01-10', '2024-01-10', 1.0, 1.5, 'João Silva', 'Identificados alguns riscos superficiais na pintura lateral direita'),
((SELECT id FROM projects WHERE title = 'Detalhamento Premium Completo'), 'Lavagem Externa', 'Lavagem completa da carroceria e rodas', 2, true, '2024-01-11', '2024-01-11', 2.0, 2.0, 'Maria Santos', 'Utilizado shampoo neutro e descontaminante de ferro'),
((SELECT id FROM projects WHERE title = 'Detalhamento Premium Completo'), 'Clay Bar', 'Descontaminação da pintura com clay bar', 3, true, '2024-01-12', '2024-01-12', 3.0, 3.5, 'João Silva', 'Pintura estava mais contaminada que o esperado'),
((SELECT id FROM projects WHERE title = 'Detalhamento Premium Completo'), 'Polimento', 'Polimento para remoção de riscos e micro riscos', 4, false, '2024-01-15', null, 4.0, 2.5, 'João Silva', 'Em andamento - 60% concluído'),
((SELECT id FROM projects WHERE title = 'Detalhamento Premium Completo'), 'Enceramento', 'Aplicação de cera de carnaúba premium', 5, false, null, null, 2.0, 0, 'Maria Santos', ''),
((SELECT id FROM projects WHERE title = 'Detalhamento Premium Completo'), 'Limpeza Interior', 'Limpeza completa do interior incluindo couro', 6, false, null, null, 3.0, 0, 'Carlos Lima', ''),
((SELECT id FROM projects WHERE title = 'Detalhamento Premium Completo'), 'Finalização', 'Inspeção final e entrega', 7, false, null, null, 1.0, 0, 'João Silva', '');

-- Inserir agendamentos
INSERT INTO schedules (client_id, vehicle_id, title, service, scheduled_date, scheduled_time, duration_hours, status, priority, notes) VALUES
((SELECT id FROM clients WHERE email = 'ana.costa@email.com'), 
 (SELECT id FROM vehicles WHERE license_plate = 'ABC-1234'), 
 'Detalhamento Premium', 
 'Detalhamento Completo', 
 '2024-01-15', 
 '09:00', 
 4.0, 
 'in-progress', 
 'high',
 'Cliente chegará às 9h em ponto'),

((SELECT id FROM clients WHERE email = 'joao.santos@email.com'), 
 (SELECT id FROM vehicles WHERE license_plate = 'JKL-3456'), 
 'Troca de Óleo', 
 'Manutenção Preventiva', 
 '2024-01-16', 
 '14:00', 
 1.5, 
 'scheduled', 
 'medium',
 'Usar óleo sintético premium'),

((SELECT id FROM clients WHERE email = 'marina.silva@email.com'), 
 (SELECT id FROM vehicles WHERE license_plate = 'MNO-7890'), 
 'Revisão Completa', 
 'Revisão dos 20.000km', 
 '2024-01-17', 
 '08:00', 
 6.0, 
 'scheduled', 
 'medium',
 'Verificar sistema de freios');

-- Inserir algumas peças dos clientes
INSERT INTO client_parts (client_id, vehicle_id, part_id, quantity, condition, notes, received_date) VALUES
((SELECT id FROM clients WHERE email = 'carlos.lima@email.com'),
 (SELECT id FROM vehicles WHERE license_plate = 'DEF-5678'),
 (SELECT id FROM parts WHERE part_number = 'BKR6E'),
 8,
 'new',
 'Velas originais para restauração',
 '2024-01-05'),

((SELECT id FROM clients WHERE email = 'ana.costa@email.com'),
 (SELECT id FROM vehicles WHERE license_plate = 'ABC-1234'),
 (SELECT id FROM parts WHERE part_number = 'W712/75'),
 2,
 'new',
 'Filtros de reposição trazidos pelo cliente',
 '2024-01-10');