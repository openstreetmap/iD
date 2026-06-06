/**
 * Vite plugin: run PostCSS for .ideditor prefix + dark-mode duplication only.
 * Autoprefixer is handled by Lightning CSS (css.transformer: 'lightningcss').
 */
import type { Plugin } from 'vite';
import postcss from 'postcss';
import type { Root } from 'postcss';
import prepend from 'postcss-prefix-selector';

/** Duplicate (prefers-color-scheme: dark) rules for .theme-light / .theme-dark. */
const darkModePlugin = {
  postcssPlugin: 'duplicate-from-media',
  Once(root: Root) {
    root.walkAtRules('media', (atRule) => {
      if (atRule.params !== '(prefers-color-scheme: dark)') return;
      atRule.walkRules((rule) => {
        const cloned = rule.clone();
        rule.selector += ':not(.theme-light)';
        cloned.selector += '.theme-dark';
        if (atRule.parent) atRule.parent.insertBefore(atRule, cloned);
      });
    });
  },
};

export function idCssPlugin(): Plugin {
  const processor = postcss([
    darkModePlugin,
    prepend({ prefix: '.ideditor', exclude: [/^\.ideditor(\[.*?\])*/] }),
  ]);

  return {
    name: 'id-css',
    enforce: 'post',
    transform(css, id) {
      if (!id.endsWith('.css')) return null;
      if (id.includes('html-proxy') || id.includes('inline-css')) return null;

      const cssStr = typeof css === 'string' ? css : String(css ?? '');
      // Skip when Vite has already wrapped CSS in a JS module (dev HMR)
      if (cssStr.startsWith('import ') && cssStr.includes('__vite__')) return null;

      const from = id || 'anonymous';
      const root = postcss.parse(cssStr, { from });

      // postcss-prefix-selector expects root.source.input.file; ensure source exists (e.g. when id is virtual)
      if (!root.source?.input) {
        root.source = {
          input: { file: from, from },
          start: { line: 1, column: 1, offset: 0 },
          end: { line: 1, column: 1, offset: 0 },
        } as Root['source'];
      }

      const result = processor.process(root, { from });
      return { code: result.css };
    },
  };
}
