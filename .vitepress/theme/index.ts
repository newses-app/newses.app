import type { Theme } from 'vitepress';
import DefaultTheme from 'vitepress/theme';
import MermaidDiagram from './components/MermaidDiagram.vue';
import ServerInstall from './components/ServerInstall.vue';
import './style.css';

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('MermaidDiagram', MermaidDiagram);
    // The self-hosting guide's regions are included in other pages.
    app.component('ServerInstall', ServerInstall);
  },
} satisfies Theme;
