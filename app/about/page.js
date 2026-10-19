import { AboutClientView } from '@/components/about-client-view.js';

export const metadata = {
  title: 'About Skillary — The 3D AI Agent Skills Registry & Package Manager',
  description:
    'Explore the open-source constellation of 1,890+ Skills, Agents, Commands, Hooks, MCPs, and Mods for AI Coding Agents (Claude Code, Cursor, Copilot, Windsurf).',
};

export default function AboutPage() {
  return <AboutClientView />;
}
