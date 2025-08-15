---
applyTo: '*'
---

# Formatting

Rules for new code
- Use `indent_style = space`, `indent_size = 4`.
- Add TypeScript comments where possible and feasable for functions and variables; always prefer to infer return types when possible.
- All new code has to use `const`, `let`.
- Do not reformat untouched cod.

# Always run…

On relevant code changes, always run:

 - `npm run lint:fix && npm run lint`
 - `npm run build`
 - `npm run test:spec -- --run`
