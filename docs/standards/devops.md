---
name: DevOps Standards
domain: devops
status: Active
last_update: 2026-11-16
source_adrs: [ADR-007]
tags: [devops, gitflow, conventional-commits, commitlint, husky, branching]
---

# DevOps Standards

Estándar de dominio que agrupa los requisitos verificables sobre el flujo de entrega y colaboración en el repositorio: estrategia de branching, formato de mensajes de commit y su enforcement. Aplica a todo el trabajo versionado en este repositorio Git.

## Branching con GitFlow

**ID:** gitflow-branching
**Estado:** Active

El trabajo en el repositorio **DEBE** seguir **GitFlow**:

- Ramas longevas: `main` (producción) y `develop` (integración).
- Trabajo de funcionalidad: `feature/<nombre>`.
- Preparación de release: `release/<versión>`.
- Correcciones urgentes en producción: `hotfix/<nombre>`.

Las features **DEBEN** integrarse hacia `develop`. Los releases y hotfixes **DEBEN** fusionarse hacia `main` y `develop` según el flujo GitFlow. **NO DEBE** usarse otra estrategia de branching (p. ej. trunk-based exclusivo o GitHub Flow) como modelo habitual en paralelo.

### Excepciones

- Repositorios o ramas temporales de experimentación documentadas **PUEDEN** desviarse si no se mergean a `main`/`develop` sin pasar por el flujo acordado.
- Renombres equivalentes acordados por el equipo (p. ej. `master` legado) **PUEDEN** usarse solo durante una migración explícita documentada en un ADR.

## Conventional Commits

**ID:** conventional-commits
**Estado:** Active

Todo mensaje de commit **DEBE** cumplir [Conventional Commits](https://www.conventionalcommits.org/): `type(scope): description` (el `scope` es opcional). Los tipos permitidos **DEBEN** ser uno de:

`feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`.

El historial así formateado **DEBE** poder alimentar changelog y versionado SemVer de forma automatizable.

### Excepciones

- Commits de merge generados por Git/GitHub (`Merge branch …`) **PUEDEN** quedar fuera del formato si la política de merge del remoto los produce automáticamente.
- Reverts que usen el tipo `revert` **DEBEN** seguir la convención; el cuerpo **PUEDE** referenciar el hash del commit revertido.

## Enforcement con commitlint (y Husky)

**ID:** commit-message-enforcement
**Estado:** Active

Los mensajes de commit **DEBEN** validarse con **commitlint** (configuración alineada con `@commitlint/config-conventional` y los tipos del requisito «Conventional Commits»). **Husky** **DEBE** usarse para ejecutar commitlint en el hook `commit-msg` (y **PUEDE** usarse para otros hooks locales de calidad).

- El proyecto **DEBE** tener commitlint configurado y operativo.
- **NO DEBE** omitirse la validación de formato en el flujo local o de CI una vez adoptado el enforcement (salvo bypass excepcional documentado).

### Excepciones

- Commits de emergencia en hotfix con `--no-verify` **PUEDEN** usarse solo con justificación explícita en el PR y corrección posterior del historial si aplica.

## Criterios de cumplimiento

| ID     | Requisito                  | Descripción                                                                                          | Automatizable | Enfoque    | Verificación                                              |
| ------ | -------------------------- | ---------------------------------------------------------------------------------------------------- | ------------- | ---------- | --------------------------------------------------------- |
| CR-001 | gitflow-branching          | El trabajo **DEBE** usar GitFlow (`main`, `develop`, `feature/*`, `release/*`, `hotfix/*`)           | no            | bloqueante | Pending                                                   |
| CR-002 | conventional-commits       | Los mensajes **DEBEN** seguir Conventional Commits con los tipos permitidos del requisito            | yes           | bloqueante | [checks/devops.mjs](../../scripts/arch/checks/devops.mjs) |
| CR-003 | commit-message-enforcement | El proyecto **DEBE** validar con commitlint; Husky **DEBE** engancharlo en `commit-msg`              | yes           | bloqueante | [checks/devops.mjs](../../scripts/arch/checks/devops.mjs) |

## Referencias

- [ADR-007: Estrategia de branching GitFlow y Conventional Commits](../adr/ADR-007-gitflow-conventional-commits.md)
- [scripts/arch/README.md](../../scripts/arch/README.md)
- [GitFlow](https://nvie.com/posts/a-successful-git-branching-model/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [commitlint](https://commitlint.js.org/)
- [Husky](https://typicode.github.io/husky/)
