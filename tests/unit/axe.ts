import axe from 'axe-core'

/** Esegue axe sul nodo e restituisce le violazioni WCAG 2.1 A/AA. */
export async function axeViolations(node: Element) {
  const results = await axe.run(node, {
    runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] },
    // jsdom non calcola gli stili: il contrasto è verificato da Storybook e Playwright.
    rules: { 'color-contrast': { enabled: false } },
  })
  return results.violations.map((v) => `${v.id}: ${v.help}`)
}
