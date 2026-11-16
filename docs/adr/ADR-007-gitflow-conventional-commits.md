---
id: ADR-007
status: Accepted
last_update: 2026-11-16
deciders: [Equipo de Arquitectura]
tags: [devops, gitflow, conventional-commits, commitlint, husky, branching]
supersedes: null
superseded_by: null
emits: [devops/CR-001, devops/CR-002, devops/CR-003]
---

# ADR-007: Estrategia de branching GitFlow y Conventional Commits

## Contexto

Sin una estrategia común de ramas y de mensajes de commit, los flujos de integración divergen (`feature` sin convención, merges directos a `main`, mensajes libres) y se pierde predictibilidad en PRs, releases y hotfixes. Además, sin Conventional Commits es difícil generar changelogs y alinear el versionado SemVer con el historial de forma automática.

Se necesita un modelo de branching conocido (GitFlow) y un formato de commit normativo, con enforcement automatizable vía commitlint (y Husky en el ciclo de commit local).

## Decisión

Se adopta la siguiente estrategia de colaboración en el repositorio:

1. **Branching:** **GitFlow** — ramas longevas `main` y `develop`; trabajo en `feature/*`, `release/*` y `hotfix/*` según el flujo clásico de GitFlow.
2. **Mensajes de commit:** **Conventional Commits** (`type(scope): description`), con tipos permitidos explícitos (`feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`).
3. **Enforcement:** validación de mensajes con **commitlint** y **Husky** en el hook `commit-msg`.

El enunciado normativo (RFC 2119), los criterios de cumplimiento verificables y sus fitness functions de esta decisión viven en el estándar de dominio **DevOps Standards** ([docs/standards/devops.md](../standards/devops.md)), no en este ADR.

## Consecuencias

### Positivas

- Ramas y merges predecibles facilitan revisión, releases y hotfixes.
- Conventional Commits habilitan changelog y SemVer derivados del historial.
- commitlint + Husky reducen drift de formato antes de llegar a CI.

### Negativas / trade-offs

- GitFlow añade ceremonias (`release/*`, merges a `main` y `develop`) frente a un trunk-based más simple.
- Scopes y tipos deben mantenerse acotados para no fragmentar el historial.
- El hook local puede omitirse con `--no-verify` (solo como excepción justificada).

## Referencias

- [DevOps Standards](../standards/devops.md)
- [Índice de ADRs](./README.md)
- [GitFlow (original)](https://nvie.com/posts/a-successful-git-branching-model/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [commitlint](https://commitlint.js.org/)
- [Husky](https://typicode.github.io/husky/)
- Config: [commitlint.config.mjs](../../commitlint.config.mjs), hook [.husky/commit-msg](../../.husky/commit-msg)
