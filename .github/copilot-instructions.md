# lin

---

## Build, test and utility commands

- Use `yarn` tasks for consistency (they ensure correct environment variables and configuration).
- Prefer `yarn turbo` for tasks defined in the relevant `turbo.json` (closest or root) to leverage caching.
- When performing multiple commands with `yarn turbo` (for example `test` and `lint`), batch them together in a single invocation.

Examples:

```bash
yarn workspace @lin/??? add           # add a new dependency
yarn turbo lint -F @lin/???           # run a Turbo command
yarn turbo test typecheck -F @lin/??? # run multiple Turbo commands
```

---
