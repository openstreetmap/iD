import { defineConfig } from 'oxfmt';
import { ignorePatternsForAllowlist, oxcAllowlist } from './oxc.allowlist.mjs';

export default defineConfig({
    tabWidth: 4,
    useTabs: false,
    singleQuote: true,
    semi: true,
    trailingComma: 'all',
    lineEnding: 'lf',
    insertFinalNewline: true,
    ignorePatterns: ignorePatternsForAllowlist(oxcAllowlist),
});
