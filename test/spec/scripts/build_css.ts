import type { Plugin } from 'vite';
import { idCssPlugin } from '../../../scripts/build_css';

/** Invoke the plugin's `transform` hook directly, regardless of object/function form. */
function transform(css: string, id: string): string | null {
  const hook = (idCssPlugin() as Plugin).transform;
  const handler = typeof hook === 'function' ? hook : hook?.handler;
  if (!handler) throw new Error('idCssPlugin has no transform handler');
  // The real hook receives a Vite plugin context as `this`; the plugin never uses it.
  const result = (handler as any).call({}, css, id);
  if (!result) return null;
  return typeof result === 'string' ? result : (result as { code: string }).code;
}

describe('idCssPlugin', () => {
  describe('non-CSS handling', () => {
    it('ignores non-.css ids', () => {
      expect(transform('.foo { color: red; }', '/some/module.js')).toBe(null);
    });

    it('ignores Vite html-proxy / inline-css ids', () => {
      expect(transform('.foo { color: red; }', '/index.html?html-proxy&index=0.css')).toBe(null);
      expect(transform('.foo { color: red; }', '/x.css?inline-css')).toBe(null);
    });

    it('skips dev HMR JS-wrapped CSS', () => {
      const wrapped = 'import { __vite__ } from "/@vite/client";';
      expect(transform(wrapped, '/x.css')).toBe(null);
    });
  });

  describe('.ideditor scoping', () => {
    it('prefixes bare selectors with .ideditor', () => {
      const out = transform('.foo { color: red; }', '/x.css');
      expect(out).toContain('.ideditor .foo');
    });

    it('does not double-prefix selectors already starting with .ideditor', () => {
      const out = transform('.ideditor .foo { color: red; }', '/x.css') ?? '';
      expect(out).toContain('.ideditor .foo');
      expect(out).not.toContain('.ideditor .ideditor');
    });
  });

  describe('dark-mode duplication', () => {
    it('rewrites prefers-color-scheme:dark into :not(.theme-light) and .theme-dark variants', () => {
      const input = '@media (prefers-color-scheme: dark) { .foo { color: white; } }';
      const out = transform(input, '/x.css') ?? '';
      // OS-dark applies unless the user forced light:
      expect(out).toContain('.ideditor .foo:not(.theme-light)');
      // explicit dark theme applies even when the OS is light:
      expect(out).toContain('.ideditor .foo.theme-dark');
      // the duplicated rule is hoisted out as a sibling, so .theme-dark is not inside the @media:
      const themeDarkIndex = out.indexOf('.theme-dark');
      const mediaIndex = out.indexOf('@media');
      expect(themeDarkIndex).toBeLessThan(mediaIndex);
    });

    it('leaves non-dark media queries untouched', () => {
      const input = '@media (min-width: 600px) { .foo { color: red; } }';
      const out = transform(input, '/x.css') ?? '';
      expect(out).not.toContain('.theme-dark');
      expect(out).not.toContain(':not(.theme-light)');
      expect(out).toContain('@media (min-width: 600px)');
    });
  });
});
