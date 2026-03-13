# Contributing

Thanks for your interest in contributing! Here's how to get started.

## Adding a New Skill

Each skill is a self-contained folder under `skills/` with its own CLI bundled inside:

```
skills/<name>/
├── SKILL.md              # Skill definition (what the agent sees)
└── cli/                  # Bundled CLI
    ├── src/
    │   ├── cli.ts        # Entry point
    │   ├── helpers.ts    # Shared utilities (BASE_URL, apiFetch, etc.)
    │   └── commands/     # One file per command
    ├── tests/
    │   ├── helpers.ts    # Test utilities (runCLI, parseJSON)
    │   └── commands/     # One test file per command
    ├── package.json
    └── tsconfig.json
```

## Development Setup

1. Install [Bun](https://bun.sh):

```bash
curl -fsSL https://bun.sh/install | bash
```

2. Clone the repo:

```bash
git clone https://github.com/mikkelkrogsholm/skills.git
cd skills
```

3. Install dependencies for a skill:

```bash
cd skills/<name>/cli
bun install
```

4. Run tests:

```bash
bun test
```

## Conventions

- **CLI framework**: [bunli](https://github.com/anthropics/bunli) (`@bunli/core`, `@bunli/utils`)
- **Validation**: Zod (use `z.coerce.number()` / `z.coerce.boolean()` for CLI flags)
- **Output**: Default format is JSON (`--format json|table|plain`)
- **Errors**: Write to stderr as `{ "error": "...", "code": "..." }` with exit code 1
- **Tests**: Hit the real API (no mocking), use small page sizes to keep tests fast
- **API resilience**: Include retry logic with exponential backoff in `apiFetch`

## Submitting a PR

1. Fork the repo and create a feature branch
2. Add your skill following the structure above
3. Make sure all tests pass (`bun test` in your skill's `cli/` directory)
4. Register the skill in `skills-lock.json`
5. Update `CHANGELOG.md` under `[Unreleased]`
6. Open a PR with a clear description of what the skill does
