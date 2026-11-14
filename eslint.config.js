// @ts-check
import js from '@eslint/js';
import globals from 'globals';
import confusingGlobals from 'confusing-browser-globals';
import tseslint from 'typescript-eslint';
import vitest from '@vitest/eslint-plugin';

export default tseslint.config(
  js.configs.recommended,

  // TS rules should only apply to TS files
  tseslint.configs.recommended.map(block => block.rules ? { ...block, files: ['**/*.ts'] } : block),

  {
    files: ['**/*.{js,ts}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
      }
    },
    rules: {
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/consistent-type-imports': ['error', { disallowTypeAnnotations: false }],
      '@typescript-eslint/no-empty-object-type': ['error', { allowInterfaces: 'with-single-extends' }],
      '@typescript-eslint/no-explicit-any': 'off',

      'accessor-pairs': 'error',
      'array-callback-return': 'error',
      'arrow-spacing': 'error',
      'block-scoped-var': 'error',
      'block-spacing': ['error', 'always'],
      'brace-style': ['error', '1tbs', { 'allowSingleLine': true }],
      'complexity': ['error', 50],
      'curly': ['error', 'multi-line'],
      'default-case-last': 'error',
      'default-param-last': 'error',
      'dot-notation': 'error',
      'eqeqeq': ['error', 'smart'],
      'func-call-spacing': ['error', 'never'],
      'grouped-accessor-pairs': 'error',
      'indent': ['off', 4],
      'keyword-spacing': 'error',
      'linebreak-style': ['error', 'unix'],
      'no-caller': 'error',
      'no-catch-shadow': 'error',
      'no-console': [
        'error',
        // ban console.log but allow everything else
        { allow: Object.keys(console).filter((method) => method !== 'log') },
      ],
      'no-constructor-return': 'error',
      'no-div-regex': 'error',
      'no-duplicate-imports': ['error', { 'allowSeparateTypeImports': true }],
      'no-eq-null': 'error',
      'no-eval': 'error',
      'no-extend-native': 'error',
      'no-extra-bind': 'error',
      'no-extra-label': 'error',
      'no-floating-decimal': 'error',
      'no-global-assign': 'error',
      'no-implicit-coercion': ['error', { 'boolean': false, 'number': false }],
      'no-implied-eval': 'error',
      'no-invalid-this': 'off',
      'no-iterator': 'error',
      'no-label-var': 'error',
      'no-labels': 'error',
      'no-lone-blocks': 'error',
      'no-loop-func': 'error',
      'no-loss-of-precision': 'error',
      'no-multi-assign': 'error',
      'no-multi-str': 'error',
      'no-new': 'error',
      'no-new-func': 'error',
      'no-new-wrappers': 'error',
      'no-octal': 'error',
      'no-octal-escape': 'error',
      'no-process-env': 'error',
      'no-promise-executor-return': 'error',
      'no-proto': 'error',
      'no-prototype-builtins': 'off',
      'no-restricted-globals': ['error', ...confusingGlobals],
      'no-restricted-properties': 'error',
      'no-return-assign': 'off',
      'no-return-await': 'error',
      'no-script-url': 'error',
      'no-self-compare': 'error',
      'no-sequences': 'error',
      'no-shadow': 'off',
      'no-shadow-restricted-names': 'error',
      'no-template-curly-in-string': 'error',
      'no-throw-literal': 'error',
      'no-trailing-spaces': 'error',
      'no-unassigned-vars': 'error',
      'no-undef-init': 'error',
      'no-unexpected-multiline': 'error',
      'no-unmodified-loop-condition': 'error',
      'no-unneeded-ternary': 'error',
      'no-unreachable': 'error',
      'no-unreachable-loop': 'error',
      'no-unused-expressions': 'error',
      'no-use-before-define': ['off', 'nofunc'],
      'no-useless-assignment': 'error',
      'no-useless-backreference': 'error',
      'no-useless-call': 'error',
      'no-useless-computed-key': 'error',
      'no-useless-concat': 'error',
      'no-useless-constructor': 'error',
      'no-useless-escape': 'off',
      'no-useless-rename': 'error',
      'no-var': 'off',
      'no-void': 'error',
      'no-warning-comments': 'error',
      'no-whitespace-before-property': 'error',
      'no-with': 'error',
      'prefer-const': 'off',
      'prefer-rest-params': 'off',
      'prefer-spread': 'off',
      'quotes': ['error', 'single'],
      'radix': ['error', 'always'],
      'require-await': 'error',
      'semi': ['error', 'always'],
      'semi-spacing': 'error',
      'sort-keys': ['error', 'asc', { allowLineSeparatedGroups: true, minKeys: 35 }],
      'space-unary-ops': 'error',
      'wrap-regex': 'off'
    }
  },
  {
    // extra rules for JS files only, where TS is not available:
    files: ['**/*.js'],
    rules: {
      'no-undef': 'error',
    }
  },
  {
    files: ['test/**/*.{js,ts}'],
    plugins: {
      vitest,
    },
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.vitest,
        ...vitest.environments.env.globals,
        'expect': 'writable',
        'iD': 'readonly',
        'jsdom': 'readonly',
        'vi': 'readonly'
      }
    },
    rules: {
      ...vitest.configs.recommended.rules,
      'no-unused-expressions': 'error',
      'no-unused-vars': 'error',
      'vitest/expect-expect': ['error', {
        assertFunctionNames: ['expect', 'doMatch', 'dontMatch', 'verifySingleCrossingIssue']
      }],
      'vitest/no-commented-out-tests': 'off',
      'vitest/no-disabled-tests': 'off',
      'vitest/valid-expect': ['error', {
        maxArgs: 2
      }]
    }
  },
  {
    files: ['{config,scripts}/**/*.{js,ts}'],
    languageOptions: {
      globals: {
        ...globals.node,
      }
    }
  },
  {
    files: ['eslint.config.js'],
    rules: {
      'indent': ['error', 2],
      'sort-keys': ['error', 'asc', { minKeys: 5 }]
    }
  }
);
