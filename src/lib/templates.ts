// Pre-configured Templates for Notes and Kanban Boards

export interface NoteTemplate {
  id: string;
  title: string;
  description: string;
  color: string;
  content: string;
  checklist?: { id: string; text: string; completed: boolean }[];
}

export interface BoardTemplate {
  id: string;
  title: string;
  description: string;
  color: string;
  columns: {
    title: string;
    cards: {
      title: string;
      description?: string;
      priority?: 'Baixa' | 'Média' | 'Alta';
      checklist?: { id: string; text: string; completed: boolean }[];
    }[];
  }[];
}

export const NOTE_TEMPLATES: NoteTemplate[] = [
  {
    id: 'tpl_daily_plan',
    title: '📝 Planejamento Diário',
    description: 'Organize suas metas e prioridades do dia',
    color: '#fef3c7', // warm yellow
    content: `## ☀️ Objetivos Principais do Dia\n1. \n2. \n3. \n\n## 💡 Anotações & Lembretes\n- `,
    checklist: [
      { id: '1', text: 'Revisar tarefas prioritárias', completed: false },
      { id: '2', text: 'Beber 2L de água', completed: false },
      { id: '3', text: 'Praticar exercício ou caminhada', completed: false },
      { id: '4', text: 'Revisar conquistas do dia', completed: false },
    ],
  },
  {
    id: 'tpl_meeting_notes',
    title: '🤝 Ata de Reunião',
    description: 'Registre tópicos, decisões e ações combinadas',
    color: '#e0f2fe', // soft blue
    content: `**Data / Hora:** \n**Participantes:** \n**Pauta:** \n\n### 📌 Tópicos Discutidos\n- \n\n### ⚡ Decisões Tomadas\n- \n\n### 🚀 Próximos Passos & Responsáveis\n- `,
  },
  {
    id: 'tpl_shopping_list',
    title: '🛒 Lista de Compras Organizada',
    description: 'Checklist para supermercado e feira',
    color: '#dcfce7', // soft green
    content: `### 🥦 Hortifrúti & Frescos\n\n### 🥩 Proteínas & Laticínios\n\n### 🧼 Limpeza & Casa`,
    checklist: [
      { id: 's1', text: 'Frutas e Verduras', completed: false },
      { id: 's2', text: 'Leite e Ovos', completed: false },
      { id: 's3', text: 'Pão integral', completed: false },
      { id: 's4', text: 'Produtos de Limpeza', completed: false },
    ],
  },
  {
    id: 'tpl_workout_plan',
    title: '💪 Diário de Treino & Nutrição',
    description: 'Acompanhe cargas, repetições e refeições',
    color: '#fce7f3', // soft pink
    content: `### 🏋️ Treino do Dia\n- **Exercício 1:** 4 séries x 10 repetições\n- **Exercício 2:** 3 séries x 12 repetições\n\n### 🥗 Metas Nutricionais\n- Proteínas: ~120g\n- Água: 3 Litros`,
  },
];

export const BOARD_TEMPLATES: BoardTemplate[] = [
  {
    id: 'board_weekly',
    title: '📅 Planejamento Semanal',
    description: 'Acompanhe tarefas de Segunda a Domingo',
    color: '#3b82f6',
    columns: [
      {
        title: '📌 A Fazer',
        cards: [
          { title: 'Definir prioridades da semana', priority: 'Alta' },
          { title: 'Organizar documentos e finanças', priority: 'Média' },
        ],
      },
      {
        title: '⏳ Em Progresso',
        cards: [{ title: 'Projeto atual KeepBoard', priority: 'Alta' }],
      },
      {
        title: '✅ Concluído',
        cards: [{ title: 'Revisão das metas passadas', priority: 'Baixa' }],
      },
    ],
  },
  {
    id: 'board_study',
    title: '📚 Organização de Estudos / Cursos',
    description: 'Gerencie matérias, leituras e revisões',
    color: '#8b5cf6',
    columns: [
      {
        title: '📖 A Ler / Assistir',
        cards: [{ title: 'Módulo 1 - Fundamentos', priority: 'Alta' }],
      },
      {
        title: '✏️ Exercícios & Prática',
        cards: [{ title: 'Resumo e Mapa Mental', priority: 'Média' }],
      },
      {
        title: '🔄 Revisão Espaçada',
        cards: [{ title: 'Revisão dos tópicos difíceis', priority: 'Alta' }],
      },
      {
        title: '🏆 Dominado',
        cards: [{ title: 'Introdução e Configurações', priority: 'Baixa' }],
      },
    ],
  },
  {
    id: 'board_personal_projects',
    title: '🚀 Projeto Pessoal / Startup',
    description: 'Fluxo Ideia → Design → Desenvolvimento → Lançamento',
    color: '#10b981',
    columns: [
      { title: '💡 Ideias & Pesquisa', cards: [{ title: 'Definir escopo do projeto' }] },
      { title: '🎨 Design & Protótipo', cards: [{ title: 'Criar wireframe das telas' }] },
      { title: '💻 Em Desenvolvimento', cards: [{ title: 'Construir protótipo funcional' }] },
      { title: '🚀 Lançado / Concluído', cards: [{ title: 'Configurar domínio e servidor' }] },
    ],
  },
];
