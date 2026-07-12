import { describe, it, expect } from 'vitest';
import { parseHTML } from 'linkedom';
import { renderResult } from '../src/panel/panel';
import { score } from '../src/engine';

describe('renderResult', () => {
  it('renders the buzzword-load meter and decoded claims', () => {
    const { document } = parseHTML('<div id="root"></div>');
    const root = document.getElementById('root')! as unknown as HTMLElement;
    renderResult(
      root,
      score(
        'This cutting-edge, best-in-class, world-class platform leverages seamless synergy and ' +
          'next-generation innovation to unlock disruptive, transformative, revolutionary value across ' +
          'the entire ecosystem for every forward-thinking enterprise team building software today.',
      ),
    );
    expect(root.querySelector('[data-testid="meter"]')).toBeTruthy();
    expect(root.textContent).toContain('Buzzword load');
    expect(root.textContent).toContain('seamless');
  });

  it('shows a no-signal meter when there is too little text', () => {
    const { document } = parseHTML('<div id="root"></div>');
    const root = document.getElementById('root')! as unknown as HTMLElement;
    renderResult(root, score('the and of to a'));
    expect(root.textContent).toContain('No signal');
  });
});
