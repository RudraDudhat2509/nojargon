import { describe, it, expect } from 'vitest';
import { parseHTML } from 'linkedom';
import { renderResult } from '../src/panel/panel';
import { score } from '../src/engine';

describe('renderResult', () => {
  it('renders the substance meter and decoded claims', () => {
    const { document } = parseHTML('<div id="root"></div>');
    const root = document.getElementById('root')! as unknown as HTMLElement;
    renderResult(root, score('cutting-edge seamless synergy, costs $29, 12 integrations'));
    expect(root.querySelector('[data-testid="meter"]')).toBeTruthy();
    expect(root.textContent).toContain('seamless');
  });

  it('shows a no-signal meter when substancePct is null', () => {
    const { document } = parseHTML('<div id="root"></div>');
    const root = document.getElementById('root')! as unknown as HTMLElement;
    renderResult(root, score('the and of to a'));
    expect(root.textContent).toContain('No signal');
  });
});
