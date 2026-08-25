import axios from 'axios';

export interface ExerciseDbItem {
  id: string;
  name: string;
  bodyPart: string;
  equipment: string;
  gifUrl: string;
  imageUrl?: string;
  images?: string[];
  target: string;
  secondaryMuscles?: string[];
  instructions?: string[];
  level?: string;
  category?: string;
}

export const BODY_PART_TRANSLATIONS: Record<string, string> = {
  all: 'Todos os Músculos',
  chest: 'Peitoral',
  back: 'Costas & Dorsais',
  'upper arms': 'Braços (Bíceps/Tríceps)',
  biceps: 'Bíceps',
  triceps: 'Tríceps',
  'lower arms': 'Antebraços',
  forearms: 'Antebraços',
  'upper legs': 'Quadríceps & Pernas',
  quads: 'Quadríceps',
  quadriceps: 'Quadríceps',
  hamstrings: 'Posterior de Coxa',
  glutes: 'Glúteos',
  'lower legs': 'Panturrilhas',
  calves: 'Panturrilhas',
  shoulders: 'Ombros / Deltoides',
  waist: 'Abdômen & Core',
  abdominals: 'Abdômen & Core',
  abs: 'Abdômen & Core',
  cardio: 'Cardio & Resistência',
  neck: 'Pescoço & Trapézio',
  traps: 'Trapézio',
  lats: 'Grande Dorsal',
  'middle back': 'Meio das Costas',
  'lower back': 'Lombar',
};

export const EQUIPMENT_TRANSLATIONS: Record<string, string> = {
  all: 'Todos os Equipamentos',
  barbell: 'Barra',
  dumbbell: 'Halteres',
  cable: 'Polia / Cabo',
  'body weight': 'Peso do Corpo',
  'body only': 'Peso do Corpo',
  'leverage machine': 'Máquina Articulada',
  machine: 'Máquina',
  'smith machine': 'Smith Machine',
  band: 'Elástico / Faixa',
  bands: 'Elásticos',
  kettlebell: 'Kettlebell',
  kettlebells: 'Kettlebells',
  'medicine ball': 'Medicine Ball',
  'stability ball': 'Bola Suíça / Exercício',
  'exercise ball': 'Bola de Exercício',
  rope: 'Corda',
  assisted: 'Máquina Assistida',
  roller: 'Rolo de Liberação',
  other: 'Outro',
};

export const TARGET_TRANSLATIONS: Record<string, string> = {
  pectorals: 'Peitoral Maior',
  chest: 'Peitoral',
  lats: 'Grande Dorsal',
  'middle back': 'Dorsais Médios',
  'lower back': 'Lombar',
  biceps: 'Bíceps Braquial',
  triceps: 'Tríceps',
  quadriceps: 'Quadríceps',
  quads: 'Quadríceps',
  hamstrings: 'Posterior de Coxa',
  glutes: 'Glúteos',
  delts: 'Deltoides',
  shoulders: 'Deltoides / Ombros',
  abdominals: 'Abdominais',
  abs: 'Abdominais',
  calves: 'Panturrilhas',
  traps: 'Trapézio',
  forearms: 'Antebraços',
  spine: 'Lombar & Eretor',
  cardiovascular: 'Sistema Cardiovascular',
};

// Curated exercises served locally directly from our own server
export const CURATED_EXERCISES: ExerciseDbItem[] = [
  // --- PEITORAL / CHEST ---
  {
    id: '3294',
    name: 'Flexão Arqueiro (Archer Push-Up)',
    bodyPart: 'chest',
    equipment: 'body weight',
    target: 'pectorals',
    gifUrl: '/exercises/3294-A9qxk2F.gif',
    imageUrl: '/exercises/3294-A9qxk2F.jpg',
    secondaryMuscles: ['triceps', 'shoulders'],
    instructions: [
      'Inicie na posição de flexão de braço com as mãos afastadas.',
      'Desça o corpo flexionando um dos braços enquanto o outro estende lateralmente.',
      'Empurre de volta ao centro e alterne o lado.',
    ],
  },
  {
    id: '1254',
    name: 'Flexão com Palmas / Clap Push-Up',
    bodyPart: 'chest',
    equipment: 'body weight',
    target: 'pectorals',
    gifUrl: '/exercises/1254-20Z6eGq.gif',
    imageUrl: '/exercises/1254-20Z6eGq.jpg',
    secondaryMuscles: ['triceps', 'delts'],
    instructions: [
      'Desça controlando na flexão.',
      'Empurre o chão com explosão até as mãos saírem do chão para bater palma.',
      'Aterrisse amortecendo com os cotovelos flexionados.',
    ],
  },
  {
    id: '0025',
    name: 'Supino Reto com Barra (Barbell Bench Press)',
    bodyPart: 'chest',
    equipment: 'barbell',
    target: 'pectorals',
    gifUrl: '/exercises/0025-yS33rK4.gif',
    imageUrl: '/exercises/0025-yS33rK4.jpg',
    secondaryMuscles: ['triceps', 'shoulders'],
    instructions: [
      'Deite-se no banco mantendo os pés firmes no chão.',
      'Segure a barra com pegada ligeiramente além da largura dos ombros.',
      'Abaixe a barra de forma controlada até encostar no meio do peitoral.',
      'Empurre a barra para cima até a extensão completa dos cotovelos.',
    ],
  },
  {
    id: '0033',
    name: 'Supino Declinado com Barra (Barbell Decline Press)',
    bodyPart: 'chest',
    equipment: 'barbell',
    target: 'pectorals',
    gifUrl: '/exercises/0033-cO56bU6.gif',
    imageUrl: '/exercises/0033-cO56bU6.jpg',
    secondaryMuscles: ['triceps', 'shoulders'],
    instructions: [
      'Deite-se no banco declinado travando os pés no suporte.',
      'Desça a barra até a parte inferior do peitoral.',
      'Empurre estendendo os braços com potência.',
    ],
  },
  {
    id: '0047',
    name: 'Supino Inclinado com Barra (Incline Barbell Press)',
    bodyPart: 'chest',
    equipment: 'barbell',
    target: 'pectorals',
    gifUrl: '/exercises/0047-t0D06aJ.gif',
    imageUrl: '/exercises/0047-t0D06aJ.jpg',
    secondaryMuscles: ['delts', 'triceps'],
    instructions: [
      'No banco inclinado a 30°-45°, segure a barra firme.',
      'Abaixe a barra até a parte superior do peito.',
      'Empurre estendendo os braços para cima.',
    ],
  },

  // --- COSTAS / DORSAL ---
  {
    id: '0032',
    name: 'Deadlift / Levantamento Terra com Barra',
    bodyPart: 'back',
    equipment: 'barbell',
    target: 'lats',
    gifUrl: '/exercises/0032-pZqW9i0.gif',
    imageUrl: '/exercises/0032-pZqW9i0.jpg',
    secondaryMuscles: ['glutes', 'hamstrings', 'lower back'],
    instructions: [
      'Fique em pé com os pés na largura do quadril sob a barra.',
      'Flexione os joelhos e o quadril segurando a barra.',
      'Mantenha a coluna reta e erga a barra estendendo pernas e quadril juntos.',
    ],
  },
  {
    id: '0150',
    name: 'Remada Unilateral com Halter / Serrote (Dumbbell Row)',
    bodyPart: 'back',
    equipment: 'dumbbell',
    target: 'lats',
    gifUrl: '/exercises/0150-eI33uOq.gif',
    imageUrl: '/exercises/0150-eI33uOq.jpg',
    secondaryMuscles: ['biceps', 'rhomboids'],
    instructions: [
      'Apoie um joelho e a mão do mesmo lado sobre o banco.',
      'Com o outro braço, puxe o halter rente ao corpo até a cintura.',
      'Desça controlando e alongando as dorsais.',
    ],
  },
  {
    id: '0198',
    name: 'Remada Curvada com Barra (Barbell Row)',
    bodyPart: 'back',
    equipment: 'barbell',
    target: 'lats',
    gifUrl: '/exercises/0198-Uca11cT.gif',
    imageUrl: '/exercises/0198-Uca11cT.jpg',
    secondaryMuscles: ['biceps', 'middle back'],
    instructions: [
      'Incline o tronco mantendo a lombar neutra e joelhos semi-flexionados.',
      'Puxe a barra em direção ao abdômen.',
    ],
  },

  // --- BÍCEPS ---
  {
    id: '0031',
    name: 'Rosca Direta com Barra (Barbell Curl)',
    bodyPart: 'upper arms',
    equipment: 'barbell',
    target: 'biceps',
    gifUrl: '/exercises/0031-r7FpY1B.gif',
    imageUrl: '/exercises/0031-r7FpY1B.jpg',
    secondaryMuscles: ['forearms'],
    instructions: [
      'Segure a barra com pegada supinada na largura dos ombros.',
      'Flexione os cotovelos erguendo a barra sem movimentar o tronco.',
      'Contraia o bíceps no topo e desça controlando.',
    ],
  },
  {
    id: '0285',
    name: 'Rosca Alternada com Halteres (Dumbbell Bicep Curl)',
    bodyPart: 'upper arms',
    equipment: 'dumbbell',
    target: 'biceps',
    gifUrl: '/exercises/0285-L3j03B1.gif',
    imageUrl: '/exercises/0285-L3j03B1.jpg',
    secondaryMuscles: ['forearms'],
    instructions: [
      'Em pé, alterne a flexão dos braços girando as palmas para cima no movimento.',
    ],
  },
  {
    id: '0313',
    name: 'Rosca Martelo com Halteres (Hammer Curl)',
    bodyPart: 'upper arms',
    equipment: 'dumbbell',
    target: 'biceps',
    gifUrl: '/exercises/0313-vO4Q80j.gif',
    imageUrl: '/exercises/0313-vO4Q80j.jpg',
    secondaryMuscles: ['forearms', 'brachialis'],
    instructions: [
      'Segure os halteres com pegada neutra (palmas voltadas uma para a outra).',
      'Eleve os halteres mantendo os cotovelos fixos ao lado do corpo.',
    ],
  },

  // --- TRÍCEPS ---
  {
    id: '0019',
    name: 'Tríceps no Banco / Mergulho (Bench Dips)',
    bodyPart: 'upper arms',
    equipment: 'body weight',
    target: 'triceps',
    gifUrl: '/exercises/0019-J60bN17.gif',
    imageUrl: '/exercises/0019-J60bN17.jpg',
    secondaryMuscles: ['shoulders', 'chest'],
    instructions: [
      'Apoie as mãos na borda de um banco com as pernas estendidas à frente.',
      'Desça o quadril flexionando os cotovelos a 90 graus.',
      'Empurre estendendo os braços de volta ao início.',
    ],
  },
  {
    id: '0048',
    name: 'Tríceps Testa com Barra / Skull Crusher',
    bodyPart: 'upper arms',
    equipment: 'barbell',
    target: 'triceps',
    gifUrl: '/exercises/0048-F5qN9u5.gif',
    imageUrl: '/exercises/0048-F5qN9u5.jpg',
    secondaryMuscles: ['forearms'],
    instructions: [
      'Deite-se no banco segurando a barra com os braços estendidos.',
      'Flexione apenas os cotovelos levando a barra até próximo da testa.',
      'Estenda os cotovelos contraindo o tríceps.',
    ],
  },

  // --- OMBROS / DELTOIDES ---
  {
    id: '0037',
    name: 'Desenvolvimento Militar com Barra (Overhead Press)',
    bodyPart: 'shoulders',
    equipment: 'barbell',
    target: 'delts',
    gifUrl: '/exercises/0037-rG70x0O.gif',
    imageUrl: '/exercises/0037-rG70x0O.jpg',
    secondaryMuscles: ['triceps', 'traps'],
    instructions: [
      'Em pé, segure a barra na altura das clavículas.',
      'Empurre a barra verticalmente acima da cabeça até travar os braços.',
      'Abaixe controlando até o peito.',
    ],
  },
  {
    id: '0334',
    name: 'Elevação Lateral com Halteres (Lateral Raise)',
    bodyPart: 'shoulders',
    equipment: 'dumbbell',
    target: 'delts',
    gifUrl: '/exercises/0334-97217nS.gif',
    imageUrl: '/exercises/0334-97217nS.jpg',
    secondaryMuscles: ['traps'],
    instructions: [
      'Erga os halteres lateralmente até a linha dos ombros.',
      'Mantenha uma leve flexão nos cotovelos e desça controlando.',
    ],
  },

  // --- PERNAS & GLÚTEOS / LEGS ---
  {
    id: '0043',
    name: 'Agachamento Livre com Barra (Barbell Full Squat)',
    bodyPart: 'upper legs',
    equipment: 'barbell',
    target: 'quads',
    gifUrl: '/exercises/0043-Ue39hW5.gif',
    imageUrl: '/exercises/0043-Ue39hW5.jpg',
    secondaryMuscles: ['glutes', 'hamstrings'],
    instructions: [
      'Posicione a barra sobre o trapézio e afaste os pés na largura dos ombros.',
      'Flexione os joelhos e o quadril como se fosse sentar em uma cadeira.',
      'Desça até que as coxas fiquem paralelas ao chão e empurre pelo calcanhar para subir.',
    ],
  },
  {
    id: '0044',
    name: 'Afundo / Passada com Barra (Barbell Lunge)',
    bodyPart: 'upper legs',
    equipment: 'barbell',
    target: 'quads',
    gifUrl: '/exercises/0044-iF891Q3.gif',
    imageUrl: '/exercises/0044-iF891Q3.jpg',
    secondaryMuscles: ['glutes', 'calves'],
    instructions: [
      'Dê um passo à frente flexionando ambos os joelhos a 90 graus.',
      'Empurre de volta à posição inicial e alterne as pernas.',
    ],
  },
  {
    id: '0054',
    name: 'Levantamento Stiff com Barra (Barbell Stiff Leg Deadlift)',
    bodyPart: 'upper legs',
    equipment: 'barbell',
    target: 'hamstrings',
    gifUrl: '/exercises/0054-dI94hI4.gif',
    imageUrl: '/exercises/0054-dI94hI4.jpg',
    secondaryMuscles: ['glutes', 'lower back'],
    instructions: [
      'Com as pernas semi-estendidas, projete o quadril para trás descendo a barra junto às pernas.',
      'Sinta o alongamento intenso dos posteriores e retorne contraindo os glúteos.',
    ],
  },

  // --- ABDÔMEN & CORE ---
  {
    id: '0001',
    name: 'Abdominal Tradicional (3/4 Sit-Up)',
    bodyPart: 'waist',
    equipment: 'body weight',
    target: 'abs',
    gifUrl: '/exercises/0001-2gPfomN.gif',
    imageUrl: '/exercises/0001-2gPfomN.jpg',
    secondaryMuscles: ['hip flexors'],
    instructions: [
      'Deite-se com os joelhos flexionados e pés firmes no chão.',
      'Eleve o tronco contraindo o abdômen até 45 graus.',
      'Desça de forma controlada.',
    ],
  },
  {
    id: '0003',
    name: 'Abdominal Bicicleta / Air Bike',
    bodyPart: 'waist',
    equipment: 'body weight',
    target: 'abs',
    gifUrl: '/exercises/0003-1ZFqTDN.gif',
    imageUrl: '/exercises/0003-1ZFqTDN.jpg',
    secondaryMuscles: ['obliques'],
    instructions: [
      'Alterne o cotovelo em direção ao joelho oposto em movimento de pedalada.',
    ],
  },
  {
    id: '0006',
    name: 'Toque nos Calcanhares Alternado (Heel Touchers)',
    bodyPart: 'waist',
    equipment: 'body weight',
    target: 'abs',
    gifUrl: '/exercises/0006-qaZVsGk.gif',
    imageUrl: '/exercises/0006-qaZVsGk.jpg',
    secondaryMuscles: ['obliques'],
    instructions: [
      'Deite-se e incline o tronco lateralmente para tocar um calcanhar de cada vez.',
    ],
  },
  {
    id: '0007',
    name: 'Prancha Lateral no Solo (Side Plank)',
    bodyPart: 'waist',
    equipment: 'body weight',
    target: 'abs',
    gifUrl: '/exercises/0007-4IKbhHV.gif',
    imageUrl: '/exercises/0007-4IKbhHV.jpg',
    secondaryMuscles: ['obliques', 'shoulders'],
    instructions: [
      'Apoie o antebraço no chão e sustente o corpo alinhado lateralmente.',
    ],
  },
];

// Helper to resolve GIF URL for an exercise
export const getExerciseGifUrl = (ex: { name: string; gifUrl?: string; gif_url?: string; imageUrl?: string }): string => {
  if (ex.gifUrl && ex.gifUrl.startsWith('/exercises/')) return ex.gifUrl;
  if (ex.gif_url && ex.gif_url.startsWith('/exercises/')) return ex.gif_url;
  if (ex.gifUrl && ex.gifUrl.length > 5) return ex.gifUrl;

  const clean = (ex.name || '').toLowerCase();
  const found = CURATED_EXERCISES.find((c) => {
    const cName = c.name.toLowerCase();
    return clean.includes(cName) || cName.includes(clean) || c.id === (ex as any).id;
  });

  if (found && found.gifUrl) {
    return found.gifUrl;
  }

  if (clean.includes('supino') || clean.includes('peito') || clean.includes('bench')) {
    return '/exercises/0025-yS33rK4.gif';
  }
  if (clean.includes('rosca') || clean.includes('biceps') || clean.includes('curl')) {
    return '/exercises/0031-r7FpY1B.gif';
  }
  if (clean.includes('triceps') || clean.includes('corda') || clean.includes('dip')) {
    return '/exercises/0019-J60bN17.gif';
  }
  if (clean.includes('remada') || clean.includes('dorsal') || clean.includes('deadlift')) {
    return '/exercises/0032-pZqW9i0.gif';
  }
  if (clean.includes('agachamento') || clean.includes('squat') || clean.includes('leg')) {
    return '/exercises/0043-Ue39hW5.gif';
  }
  if (clean.includes('ombro') || clean.includes('elevaç') || clean.includes('shoulder')) {
    return '/exercises/0037-rG70x0O.gif';
  }
  if (clean.includes('abdominal') || clean.includes('prancha') || clean.includes('core')) {
    return '/exercises/0001-2gPfomN.gif';
  }

  return '/exercises/0025-yS33rK4.gif';
};

// Main fetcher served 100% locally from our own server static assets
export const fetchExerciseDb = async (): Promise<ExerciseDbItem[]> => {
  try {
    // Carrega direto do nosso servidor local (/exercises/local-exercises.json)
    const res = await axios.get<ExerciseDbItem[]>('/exercises/local-exercises.json');
    if (Array.isArray(res.data) && res.data.length > 0) {
      // Merge with curated items to ensure top quality Portuguese names
      const map = new Map<string, ExerciseDbItem>();
      
      // Put curated first
      CURATED_EXERCISES.forEach((c) => map.set(c.id, c));
      
      // Add loaded from our server
      res.data.forEach((item) => {
        if (!map.has(item.id)) {
          map.set(item.id, item);
        }
      });

      return Array.from(map.values());
    }
  } catch (err) {
    console.warn('Carregando exercícios curados locais:', err);
  }

  return CURATED_EXERCISES;
};
