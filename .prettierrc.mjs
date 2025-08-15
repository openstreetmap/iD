// @ts-check
/** @type {import('prettier').Config} */
const prettierConfig = {
    // Keep this minimal and aligned with ESLint
    semi: true,
    singleQuote: true,
    plugins: ['prettier-plugin-organize-imports'],
};

export default prettierConfig;
