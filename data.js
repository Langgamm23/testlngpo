/* =========================================================================*
   AETHERWEAVE — Data Module
   Contains mock data, sample posts, spaces, and trending topics.
   ========================================================================= */

const SPACES = [
  { id: 1, name: 'Design', color: '#e9a94d', members: 2400 },
  { id: 2, name: 'Development', color: '#56d6bd', members: 5200 },
  { id: 3, name: 'Science', color: '#f0665f', members: 3100 },
  { id: 4, name: 'Culture', color: '#ffc773', members: 1800 },
  { id: 5, name: 'General', color: '#979dac', members: 8900 }
];

const TRENDING_TOPICS = [
  { rank: 1, name: 'Web Design', discussions: 2300, change: '↑ 18%' },
  { rank: 2, name: 'AI & Machine Learning', discussions: 5100, change: '↑ 34%' },
  { rank: 3, name: 'JavaScript', discussions: 1800, change: '↑ 12%' },
  { rank: 4, name: 'UX Research', discussions: 1200, change: '↑ 8%' },
  { rank: 5, name: 'React.js', discussions: 2100, change: '↑ 22%' }
];

const SAMPLE_POSTS = [
  {
    id: 1,
    title: 'The Future of Web Design',
    body: 'Exploring modern trends in UI/UX and how they shape user experience across platforms. From glassmorphism to dark mode conventions.',
    author: 'Sarah Chen',
    handle: '@sarah.design',
    space: 'Design',
    votes: 142,
    comments: 23,
    saved: false
  },
  {
    id: 2,
    title: 'AI Breakthroughs This Week',
    body: 'A roundup of the most exciting developments in artificial intelligence and machine learning. Including the latest transformer models.',
    author: 'Alex Kumar',
    handle: '@alex.ai',
    space: 'Science',
    votes: 287,
    comments: 45,
    saved: false
  }
];