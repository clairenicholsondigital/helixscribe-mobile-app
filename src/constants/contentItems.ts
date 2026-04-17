export type ContentItem = {
  id: string;
  title: string;
  category: string;
  summary: string;
  duration: string;
  details: string;
};

export const contentItems: ContentItem[] = [
  {
    id: 'writing-sprint-101',
    title: 'Writing Sprint 101',
    category: 'Workshop',
    summary: 'A fast session on planning and shipping your first draft.',
    duration: '45 min',
    details:
      'This placeholder module walks through sprint planning, timeboxing, and drafting techniques you can use right away.'
  },
  {
    id: 'content-ops-playbook',
    title: 'Content Ops Playbook',
    category: 'Guide',
    summary: 'Build a repeatable process for content creation and review.',
    duration: '30 min',
    details:
      'Use this sample playbook to map owners, deadlines, and publishing checkpoints for your team.'
  },
  {
    id: 'audience-research-basics',
    title: 'Audience Research Basics',
    category: 'Course',
    summary: 'Learn lightweight audience research techniques.',
    duration: '60 min',
    details:
      'A starter lesson on identifying user goals, collecting feedback, and turning insights into actionable content updates.'
  }
];
