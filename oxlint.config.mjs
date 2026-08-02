import { defineConfig } from 'oxlint';
import { oxcAllowlist } from './oxc.allowlist.mjs';

// Rule sets (see overrides below; later overrides win on the same rule):
//   • All .js / .ts — develop ESLint parity (including non-allowlisted .ts)
//   • Allowlisted .ts only — stricter: no-var, prefer-const, typescript recommended, …
//     (same paths as Oxfmt; see oxc.allowlist.mjs)
//   • .js only — no-undef (TS types cover this for .ts)
// npm scripts only pass directory roots; allowlisting lives here.
export default defineConfig({
    "ignorePatterns": [
        "dist/**",
        "**/*.d.ts"
    ],
    "plugins": [],
    "categories": {
        "correctness": "off"
    },
    "env": {
        "builtin": true
    },
    "rules": {
        "constructor-super": "error",
        "for-direction": "error",
        "getter-return": "error",
        "no-async-promise-executor": "error",
        "no-case-declarations": "error",
        "no-class-assign": "error",
        "no-compare-neg-zero": "error",
        "no-cond-assign": "error",
        "no-const-assign": "error",
        "no-constant-binary-expression": "error",
        "no-constant-condition": "error",
        "no-control-regex": "error",
        "no-debugger": "error",
        "no-delete-var": "error",
        "no-dupe-class-members": "error",
        "no-dupe-else-if": "error",
        "no-dupe-keys": "error",
        "no-duplicate-case": "error",
        "no-empty": "error",
        "no-empty-character-class": "error",
        "no-empty-pattern": "error",
        "no-empty-static-block": "error",
        "no-ex-assign": "error",
        "no-extra-boolean-cast": "error",
        "no-fallthrough": "error",
        "no-func-assign": "error",
        "no-global-assign": "error",
        "no-import-assign": "error",
        "no-invalid-regexp": "error",
        "no-irregular-whitespace": "error",
        "no-loss-of-precision": "error",
        "no-misleading-character-class": "error",
        "no-new-native-nonconstructor": "error",
        "no-nonoctal-decimal-escape": "error",
        "no-obj-calls": "error",
        "no-prototype-builtins": "error",
        "no-redeclare": "error",
        "no-regex-spaces": "error",
        "no-self-assign": "error",
        "no-setter-return": "error",
        "no-shadow-restricted-names": "error",
        "no-sparse-arrays": "error",
        "no-this-before-super": "error",
        "no-unassigned-vars": "error",
        "no-unexpected-multiline": "error",
        "no-unreachable": "error",
        "no-unsafe-finally": "error",
        "no-unsafe-negation": "error",
        "no-unsafe-optional-chaining": "error",
        "no-unused-labels": "error",
        "no-unused-private-class-members": "error",
        "no-unused-vars": "error",
        "no-useless-backreference": "error",
        "no-useless-catch": "error",
        "no-useless-escape": "error",
        "no-with": "error",
        "preserve-caught-error": "error",
        "require-yield": "error",
        "use-isnan": "error",
        "valid-typeof": "error"
    },
    "overrides": [
        {
            "files": [
                "**/*.{js,ts}"
            ],
            "rules": {
                "accessor-pairs": "error",
                "array-callback-return": "warn",
                "block-scoped-var": "error",
                "complexity": [
                    "warn",
                    50
                ],
                "curly": [
                    "warn",
                    "multi-line"
                ],
                "default-case-last": "error",
                "default-param-last": "error",
                "eqeqeq": [
                    "error",
                    "smart"
                ],
                "grouped-accessor-pairs": "error",
                "no-caller": "error",
                "no-console": "warn",
                "no-constructor-return": "error",
                "no-div-regex": "error",
                "no-duplicate-imports": [
                    "warn",
                    {
                        "allowSeparateTypeImports": true
                    }
                ],
                "no-eq-null": "error",
                "no-eval": "error",
                "no-extend-native": "error",
                "no-extra-bind": "error",
                "no-extra-label": "error",
                "no-implicit-coercion": [
                    "warn",
                    {
                        "boolean": false,
                        "number": false
                    }
                ],
                "no-implied-eval": "error",
                "no-iterator": "error",
                "no-label-var": "error",
                "no-labels": "error",
                "no-lone-blocks": "error",
                "no-loop-func": "warn",
                "no-multi-assign": "error",
                "no-multi-str": "error",
                "no-new": "error",
                "no-new-func": "error",
                "no-new-wrappers": "error",
                "no-promise-executor-return": "error",
                "no-proto": "error",
                "no-prototype-builtins": "off",
                "no-restricted-globals": [
                    "error",
                    "addEventListener",
                    "blur",
                    "close",
                    "closed",
                    "confirm",
                    "defaultStatus",
                    "defaultstatus",
                    "event",
                    "external",
                    "find",
                    "focus",
                    "frameElement",
                    "frames",
                    "history",
                    "innerHeight",
                    "innerWidth",
                    "length",
                    "location",
                    "locationbar",
                    "menubar",
                    "moveBy",
                    "moveTo",
                    "name",
                    "onblur",
                    "onerror",
                    "onfocus",
                    "onload",
                    "onresize",
                    "onunload",
                    "open",
                    "opener",
                    "opera",
                    "outerHeight",
                    "outerWidth",
                    "pageXOffset",
                    "pageYOffset",
                    "parent",
                    "print",
                    "removeEventListener",
                    "resizeBy",
                    "resizeTo",
                    "screen",
                    "screenLeft",
                    "screenTop",
                    "screenX",
                    "screenY",
                    "scroll",
                    "scrollbars",
                    "scrollBy",
                    "scrollTo",
                    "scrollX",
                    "scrollY",
                    "self",
                    "status",
                    "statusbar",
                    "stop",
                    "toolbar",
                    "top"
                ],
                "no-restricted-properties": "error",
                "no-return-assign": "off",
                "no-script-url": "error",
                "no-self-compare": "error",
                "no-sequences": "error",
                "no-shadow": "off",
                "no-template-curly-in-string": "warn",
                "no-throw-literal": "error",
                "no-unassigned-vars": "warn",
                "no-unmodified-loop-condition": "error",
                "no-unneeded-ternary": "error",
                "no-unreachable": "warn",
                "no-unused-expressions": "error",
                "no-use-before-define": "off",
                "no-useless-backreference": "warn",
                "no-useless-call": "warn",
                "no-useless-computed-key": "warn",
                "no-useless-concat": "warn",
                "no-useless-constructor": "warn",
                "no-useless-escape": "off",
                "no-useless-rename": "warn",
                "no-var": "off",
                "no-void": "error",
                "no-warning-comments": "warn",
                "no-with": "error",
                "prefer-const": "off",
                "prefer-rest-params": "off",
                "prefer-spread": "off",
                "radix": [
                    "error",
                    "always"
                ],
                "require-await": "error",
                "sort-keys": [
                    "error",
                    "asc",
                    {
                        "allowLineSeparatedGroups": true,
                        "minKeys": 35
                    }
                ],
                "typescript/ban-ts-comment": "off",
                "typescript/consistent-type-imports": [
                    "error",
                    {
                        "disallowTypeAnnotations": false
                    }
                ],
                "typescript/no-explicit-any": "off"
            },
            "env": {
                "es2026": true,
                "browser": true
            },
            "globals": {
                "mapillary": "readonly"
            },
            "plugins": [
                "typescript"
            ]
        },
        {
            // Stricter TypeScript — same allowlist as Oxfmt (oxc.allowlist.mjs)
            "files": oxcAllowlist,
            "rules": {
                "constructor-super": "off",
                "getter-return": "off",
                "no-class-assign": "off",
                "no-const-assign": "off",
                "no-dupe-class-members": "off",
                "no-dupe-keys": "off",
                "no-func-assign": "off",
                "no-import-assign": "off",
                "no-new-native-nonconstructor": "off",
                "no-obj-calls": "off",
                "no-redeclare": "off",
                "no-setter-return": "off",
                "no-this-before-super": "off",
                "no-unreachable": "off",
                "no-unsafe-negation": "off",
                "no-var": "error",
                "no-with": "off",
                "prefer-const": "error",
                "prefer-rest-params": "error",
                "prefer-spread": "error",
                "no-array-constructor": "error",
                "no-unused-expressions": "error",
                "typescript/ban-ts-comment": "off",
                "typescript/no-duplicate-enum-values": "error",
                "typescript/no-empty-object-type": "error",
                "typescript/no-explicit-any": "off",
                "typescript/no-extra-non-null-assertion": "error",
                "typescript/no-misused-new": "error",
                "typescript/no-namespace": "error",
                "typescript/no-non-null-asserted-optional-chain": "error",
                "typescript/no-require-imports": "error",
                "typescript/no-this-alias": "error",
                "typescript/no-unnecessary-type-constraint": "error",
                "typescript/no-unsafe-declaration-merging": "error",
                "typescript/no-unsafe-function-type": "error",
                "typescript/no-wrapper-object-types": "error",
                "typescript/prefer-as-const": "error",
                "typescript/prefer-namespace-keyword": "error",
                "typescript/triple-slash-reference": "error"
            },
            "plugins": [
                "typescript"
            ]
        },
        {
            "files": [
                "test/**/*.{js,ts}"
            ],
            "globals": {
                "afterAll": "readonly",
                "afterEach": "readonly",
                "beforeAll": "readonly",
                "beforeEach": "readonly",
                "describe": "readonly",
                "expect": "writable",
                "fit": "readonly",
                "it": "readonly",
                "jest": "readonly",
                "test": "readonly",
                "xdescribe": "readonly",
                "xit": "readonly",
                "xtest": "readonly",
                "after": "readonly",
                "before": "readonly",
                "d3": "readonly",
                "fetchMock": "readonly",
                "happen": "readonly",
                "iD": "readonly",
                "jsdom": "readonly",
                "sinon": "readonly",
                "vi": "readonly",
                "locale": "writable",
                "t": "readonly"
            },
            "env": {
                "node": true
            },
            "rules": {
                "no-unused-vars": "warn",
                "no-unused-expressions": "off",
                "no-redeclare": "off"
            }
        },
        {
            "files": [
                "{config,scripts}/**/*.{js,ts}"
            ],
            "env": {
                "node": true
            }
        },
        {
            "files": [
                "**/*.{js,mjs,cjs}"
            ],
            "rules": {
                "no-undef": "error"
            }
        },
        {
            "files": [
                "oxlint.config.mjs"
            ],
            "rules": {
                "sort-keys": [
                    "error",
                    "asc",
                    {
                        "minKeys": 5
                    }
                ]
            }
        }
    ]
});
