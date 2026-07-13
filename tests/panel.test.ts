import { describe, it, expect } from 'vitest';
import { parseHTML } from 'linkedom';
import { renderResult } from '../src/panel/panel';
import { score } from '../src/engine';

describe('renderResult', () => {
  it('renders decoded buzzwords', () => {
    const { document } = parseHTML('<div id="root"></div>');
    const root = document.getElementById('root')! as unknown as HTMLElement;
    renderResult(
      root,
      score(
        'This cutting-edge, best-in-class, world-class platform leverages seamless synergy and ' +
          'next-generation innovation to unlock disruptive value across the entire ecosystem for teams.',
      ),
    );
    expect(root.textContent).toContain('Buzzwords decoded');
    expect(root.textContent).toContain('seamless');
  });

  it('renders nothing when there are no buzzwords', () => {
    const { document } = parseHTML('<div id="root"></div>');
    const root = document.getElementById('root')! as unknown as HTMLElement;
    renderResult(root, score('We host a Postgres database with authentication and file storage for developers.'));
    expect(root.querySelector('.claims')).toBeNull();
  });
});
