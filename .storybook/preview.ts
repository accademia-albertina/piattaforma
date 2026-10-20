import type { Preview } from '@storybook/nextjs-vite'

import '../src/styles/global.css'

const preview: Preview = {
  parameters: {
    layout: 'padded',
    controls: { matchers: { color: /(background|color)$/i } },
    a11y: {
      // Le violazioni WCAG fanno fallire i test delle storie.
      test: 'error',
      options: { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] } },
    },
  },
}

export default preview
