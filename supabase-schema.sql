-- ==========================================================
-- SCRIPT SQL PARA SUPABASE - EDUMÍDIA AGENDAMENTO ESCOLAR
-- Execute este script no SQL Editor do seu projeto Supabase
-- ==========================================================

-- 1. Criação da Tabela de Recursos (Equipamentos e Espaços)
CREATE TABLE IF NOT EXISTS public.resources (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('equipment', 'space')),
  description TEXT,
  total_quantity INTEGER NOT NULL DEFAULT 1,
  icon TEXT NOT NULL,
  color TEXT NOT NULL,
  location TEXT,
  rules TEXT,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. Criação da Tabela de Agendamentos (Bookings)
CREATE TABLE IF NOT EXISTS public.bookings (
  id TEXT PRIMARY KEY,
  teacher_name TEXT NOT NULL,
  classroom TEXT NOT NULL,
  date DATE NOT NULL,
  day_of_week TEXT NOT NULL,
  shift TEXT NOT NULL CHECK (shift IN ('matutino', 'vespertino', 'noturno', 'integral')),
  periods JSONB NOT NULL DEFAULT '[]'::jsonb,
  start_time TEXT,
  end_time TEXT,
  resource_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  resource_details JSONB DEFAULT '{}'::jsonb,
  theme TEXT NOT NULL,
  observations TEXT,
  status TEXT NOT NULL DEFAULT 'agendado' CHECK (status IN ('agendado', 'em_uso', 'concluido', 'cancelado')),
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. Índices para consultas ultrarrápidas por data, turno e professor
CREATE INDEX IF NOT EXISTS idx_bookings_date ON public.bookings(date);
CREATE INDEX IF NOT EXISTS idx_bookings_shift ON public.bookings(shift);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);

-- 4. Habilitar Row Level Security (RLS)
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- 5. Políticas públicas de leitura e escrita (Permite agendamento na rede escolar)
CREATE POLICY "Allow public read access on resources" 
ON public.resources FOR SELECT USING (true);

CREATE POLICY "Allow public all access on bookings" 
ON public.bookings FOR ALL USING (true);

-- 6. Inserção dos 8 recursos padrão pedidos pelo sistema escolar
INSERT INTO public.resources (id, name, category, description, total_quantity, icon, color, location, rules)
VALUES
  ('datashow', 'Data Show (Projetor)', 'equipment', 'Projetor multimídia EPSON Full HD com controle e cabos inclusos.', 6, 'Projector', 'blue', 'Sala dos Professores / Multimídia', 'Retirar 10 min antes da aula. Devolver na maleta.'),
  ('cabos', 'Kit de Cabos & Conectores', 'equipment', 'Kits com cabo HDMI (3m/5m), VGA, adaptador USB-C e extensão elétrica.', 10, 'Cable', 'amber', 'Armário de Mídia - Gaveta 02', 'Enrolar cabos sem torcer ao devolver.'),
  ('tv', 'TV Smart Móvel (55")', 'equipment', 'Smart TV 4K 55" em suporte com rodinhas e som estéreo integrado.', 3, 'Tv', 'indigo', 'Depósito de Recursos', 'Travar rodinhas ao posicionar na sala.'),
  ('caixa_som', 'Caixa de Som Amplificada', 'equipment', 'Caixa portátil 300W bluetooth com 2 microfones sem fio.', 4, 'Speaker', 'emerald', 'Coordenação Pedagógica', 'Conferir pilhas dos microfones na devolução.'),
  ('chromebook', 'Carrinho de Chromebooks', 'equipment', 'Gabinete de recarga móvel com 36 Chromebooks para alunos.', 2, 'Laptop', 'sky', 'Laboratório de Mídias', 'Conectar ao cabo de carga ao devolver.'),
  ('biblioteca', 'Biblioteca Escolar', 'space', 'Espaço climatizado com mesas de estudo e acervo literário.', 1, 'BookOpen', 'purple', 'Bloco A - Térreo', 'Capacidade máx. 45 alunos. Manter silêncio moderado.'),
  ('patio', 'Pátio Central Escolar', 'space', 'Área ampla coberta para feiras culturais, palestras e eventos.', 1, 'Users', 'rose', 'Área Central de Convivência', 'Avisar apoio com antecedência para cadeiras.'),
  ('labin', 'Labin (Lab. de Informática)', 'space', 'Laboratório de informática educativa com 32 computadores com internet.', 1, 'MonitorCheck', 'teal', 'Bloco B - 1º Andar', 'Proibido alimentos/bebidas. Desligar máquinas.')
ON CONFLICT (id) DO NOTHING;
