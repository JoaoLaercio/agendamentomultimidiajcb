import { Booking, PeriodSlot, Resource } from '../types';
import { getDayOfWeekName, toISODateString } from '../utils/dateUtils';

export const INITIAL_RESOURCES: Resource[] = [
  {
    id: 'datashow',
    name: 'Data Show (Projetor)',
    category: 'equipment',
    description: 'Projetor multimídia EPSON Full HD com controle e cabos inclusos.',
    totalQuantity: 6,
    icon: 'Projector',
    color: 'blue',
    location: 'Sala dos Professores / Sala Multimídia',
    rules: 'Retirar 10 min antes da aula. Devolver desligado e guardado na maleta protetora.',
  },
  {
    id: 'cabos',
    name: 'Kit de Cabos & Conectores',
    category: 'equipment',
    description: 'Kits com cabo HDMI (3m/5m), VGA, adaptador USB-C e extensão elétrica 10m.',
    totalQuantity: 10,
    icon: 'Cable',
    color: 'amber',
    location: 'Armário de Mídia - Gaveta 02',
    rules: 'Enrolar os cabos sem torcer ao devolver e conferir se todos os adaptadores estão no estojo.',
  },
  {
    id: 'tv',
    name: 'TV Smart Móvel (55")',
    category: 'equipment',
    description: 'Smart TV 4K 55" montada em suporte móvel de rodinhas com trava e som integrado.',
    totalQuantity: 3,
    icon: 'Tv',
    color: 'indigo',
    location: 'Depósito de Recursos / 2º Andar',
    rules: 'Travar as rodinhas após posicionar na sala de aula. Não mover com cabos conectados.',
  },
  {
    id: 'caixa_som',
    name: 'Caixa de Som Amplificada',
    category: 'equipment',
    description: 'Caixa amplificada portátil bluetooth 300W com 2 microfones sem fio e pedestal.',
    totalQuantity: 4,
    icon: 'Speaker',
    color: 'emerald',
    location: 'Armário Multimídia / Coordenação',
    rules: 'Conferir pilhas dos microfones e colocar a bateria para carregar na devolução se necessário.',
  },
  {
    id: 'chromebook',
    name: 'Carrinho de Chromebooks',
    category: 'equipment',
    description: 'Gabinete de recarga móvel com 36 Chromebooks para pesquisa e atividades digitais.',
    totalQuantity: 2, // 2 carrinhos com 36 cada
    icon: 'Laptop',
    color: 'sky',
    location: 'Laboratório de Mídias',
    rules: 'Conectar cada Chromebook ao cabo de energia correspondente no carrinho ao recolher.',
  },
  {
    id: 'biblioteca',
    name: 'Biblioteca Escolar',
    category: 'space',
    description: 'Espaço climatizado com mesas de estudo em grupo, acervo literário e cantinho de leitura.',
    totalQuantity: 1,
    icon: 'BookOpen',
    color: 'purple',
    location: 'Bloco A - Térreo',
    rules: 'Manter tom de voz moderado. Agendamento exclusivo para até 45 alunos simultâneos.',
  },
  {
    id: 'patio',
    name: 'Pátio Central Escolar',
    category: 'space',
    description: 'Área ampla coberta ideal para feiras de ciências, apresentações teatrais e gincanas.',
    totalQuantity: 1,
    icon: 'Users',
    color: 'rose',
    location: 'Área de Convivência Central',
    rules: 'Avisar a equipe de apoio com antecedência para organização de cadeiras se necessário.',
  },
  {
    id: 'labin',
    name: 'Labin (Lab. de Informática)',
    category: 'space',
    description: 'Laboratório de informática com 32 computadores conectados à internet de alta velocidade.',
    totalQuantity: 1,
    icon: 'MonitorCheck',
    color: 'teal',
    location: 'Bloco B - 1º Andar',
    rules: 'Não é permitido consumo de alimentos ou bebidas. Deixar as máquinas desligadas ao final.',
  },
];

export const PERIOD_SLOTS: PeriodSlot[] = [
  // Matutino
  { id: 'mat_1', label: '1ª Aula', timeRange: '07:00 - 07:50', shift: 'matutino' },
  { id: 'mat_2', label: '2ª Aula', timeRange: '07:50 - 08:40', shift: 'matutino' },
  { id: 'mat_3', label: '3ª Aula', timeRange: '08:55 - 09:45', shift: 'matutino' },
  { id: 'mat_4', label: '4ª Aula', timeRange: '09:45 - 10:35', shift: 'matutino' },
  { id: 'mat_5', label: '5ª Aula', timeRange: '10:35 - 11:25', shift: 'matutino' },
  { id: 'mat_6', label: '6ª Aula', timeRange: '11:25 - 12:15', shift: 'matutino' },

  // Vespertino
  { id: 'vesp_1', label: '1ª Aula', timeRange: '13:00 - 13:50', shift: 'vespertino' },
  { id: 'vesp_2', label: '2ª Aula', timeRange: '13:50 - 14:40', shift: 'vespertino' },
  { id: 'vesp_3', label: '3ª Aula', timeRange: '14:55 - 15:45', shift: 'vespertino' },
  { id: 'vesp_4', label: '4ª Aula', timeRange: '15:45 - 16:35', shift: 'vespertino' },
  { id: 'vesp_5', label: '5ª Aula', timeRange: '16:35 - 17:25', shift: 'vespertino' },

  // Noturno
  { id: 'not_1', label: '1ª Aula', timeRange: '19:00 - 19:45', shift: 'noturno' },
  { id: 'not_2', label: '2ª Aula', timeRange: '19:45 - 20:30', shift: 'noturno' },
  { id: 'not_3', label: '3ª Aula', timeRange: '20:45 - 21:30', shift: 'noturno' },
  { id: 'not_4', label: '4ª Aula', timeRange: '21:30 - 22:15', shift: 'noturno' },
];

export const COMMON_CLASSES = [
  '6º Ano A',
  '6º Ano B',
  '7º Ano A',
  '7º Ano B',
  '8º Ano A',
  '8º Ano B',
  '9º Ano A',
  '9º Ano B',
  '1ª Série EM - A',
  '1ª Série EM - B',
  '2ª Série EM - A',
  '2ª Série EM - B',
  '3ª Série EM - Terceirão',
  'Turma EJA - Noite',
];

export const COMMON_TEACHERS = [
  'Prof. Marcos Oliveira (História)',
  'Profa. Juliana Santos (Língua Portuguesa)',
  'Prof. Ricardo Mendonça (Matemática)',
  'Profa. Camila Ferreira (Biologia/Ciências)',
  'Prof. André Luiz (Geografia)',
  'Profa. Patrícia Alencar (Artes / Mídias)',
  'Prof. Tiago Barbosa (Educação Física)',
  'Profa. Fernanda Rocha (Inglês)',
  'Prof. Carlos Eduardo (Física/Química)',
  'Profa. Vanessa Lima (Filosofia/Sociologia)',
];

/**
 * Generates sample bookings anchored to today's date and the current week
 */
export function generateInitialBookings(): Booking[] {
  const today = new Date();
  
  // Helper to get offset date
  const getDateOffset = (offsetDays: number) => {
    const d = new Date(today);
    d.setDate(today.getDate() + offsetDays);
    return toISODateString(d);
  };

  const dToday = getDateOffset(0);
  const dTomorrow = getDateOffset(1);
  const dInTwoDays = getDateOffset(2);
  const dYesterday = getDateOffset(-1);

  return [
    {
      id: 'book-1',
      teacherName: 'Prof. Marcos Oliveira',
      classroom: '9º Ano B',
      date: dToday,
      dayOfWeek: getDayOfWeekName(dToday),
      shift: 'matutino',
      periods: ['1ª Aula (07:00 - 07:50)', '2ª Aula (07:50 - 08:40)'],
      resourceIds: ['datashow', 'cabos', 'caixa_som'],
      resourceDetails: {
        datashow: { quantity: 1 },
        cabos: { quantity: 1, notes: 'Cabo HDMI longo' },
        caixa_som: { quantity: 1 },
      },
      theme: 'Documentário: A Segunda Guerra Mundial e os Direitos Humanos',
      observations: 'Precisa da tomada dupla próxima ao quadro.',
      status: 'em_uso',
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
    {
      id: 'book-2',
      teacherName: 'Profa. Camila Ferreira',
      classroom: '7º Ano A',
      date: dToday,
      dayOfWeek: getDayOfWeekName(dToday),
      shift: 'matutino',
      periods: ['3ª Aula (08:55 - 09:45)', '4ª Aula (09:45 - 10:35)'],
      resourceIds: ['labin'],
      resourceDetails: {
        labin: { quantity: 1 },
      },
      theme: 'Pesquisa Interativa: Células e Microscopia Virtual no Labin',
      observations: 'Alunos usarão o software de simulação biológica.',
      status: 'agendado',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: 'book-3',
      teacherName: 'Profa. Juliana Santos',
      classroom: '1ª Série EM - A',
      date: dToday,
      dayOfWeek: getDayOfWeekName(dToday),
      shift: 'vespertino',
      periods: ['1ª Aula (13:00 - 13:50)', '2ª Aula (13:50 - 14:40)'],
      resourceIds: ['biblioteca'],
      resourceDetails: {
        biblioteca: { quantity: 1 },
      },
      theme: 'Círculo de Leitura e Análise de Obras de Machado de Assis',
      observations: 'Reserva exclusiva das mesas centrais da biblioteca.',
      status: 'agendado',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: 'book-4',
      teacherName: 'Prof. Ricardo Mendonça',
      classroom: '8º Ano B',
      date: dTomorrow,
      dayOfWeek: getDayOfWeekName(dTomorrow),
      shift: 'matutino',
      periods: ['2ª Aula (07:50 - 08:40)', '3ª Aula (08:55 - 09:45)'],
      resourceIds: ['chromebook'],
      resourceDetails: {
        chromebook: { quantity: 1, notes: 'Carrinho completo para 30 alunos' },
      },
      theme: 'Geometria Espacial e Geogebra nos Chromebooks',
      observations: 'Favor deixar carregados no laboratório.',
      status: 'agendado',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'book-5',
      teacherName: 'Profa. Patrícia Alencar',
      classroom: '2ª Série EM - B',
      date: dTomorrow,
      dayOfWeek: getDayOfWeekName(dTomorrow),
      shift: 'matutino',
      periods: ['4ª Aula (09:45 - 10:35)', '5ª Aula (10:35 - 11:25)'],
      resourceIds: ['tv', 'cabos'],
      resourceDetails: {
        tv: { quantity: 1 },
        cabos: { quantity: 1 },
      },
      theme: 'Apresentação dos Projetos de Curta-metragem e Cinema Brasileiro',
      observations: 'Sala 14 - Levar suporte com rodinhas.',
      status: 'agendado',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'book-6',
      teacherName: 'Prof. Tiago Barbosa',
      classroom: '6º Ano A e B',
      date: dInTwoDays,
      dayOfWeek: getDayOfWeekName(dInTwoDays),
      shift: 'matutino',
      periods: ['5ª Aula (10:35 - 11:25)', '6ª Aula (11:25 - 12:15)'],
      resourceIds: ['patio', 'caixa_som'],
      resourceDetails: {
        patio: { quantity: 1 },
        caixa_som: { quantity: 1, notes: 'Com 2 microfones sem fio' },
      },
      theme: 'Festival de Danças Folclóricas Regionais e Expressão Corporal',
      observations: 'Será utilizado o pátio central e tomadas próximas ao palco.',
      status: 'agendado',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'book-7',
      teacherName: 'Prof. André Luiz',
      classroom: '3ª Série EM - Terceirão',
      date: dYesterday,
      dayOfWeek: getDayOfWeekName(dYesterday),
      shift: 'matutino',
      periods: ['1ª Aula (07:00 - 07:50)'],
      resourceIds: ['datashow', 'cabos'],
      resourceDetails: {
        datashow: { quantity: 1 },
        cabos: { quantity: 1 },
      },
      theme: 'Geopolítica e Matrizes Energéticas Mundiais',
      observations: 'Material devolvido e conferido pela coordenação.',
      status: 'concluido',
      createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    },
  ];
}
