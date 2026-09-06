---
id: ADR-003
status: Accepted
last_update: 2026-09-06
deciders: [juanca202]
tags: [eslint, prettier, coding-style]
supersedes: null
superseded_by: null
emits: [coding-style/CR-001, coding-style/CR-002]
---

# ADR-003: ESLint y Prettier como linter y formatter

## Contexto

Varias personas tocan el mismo repositorio. Sin una herramienta de análisis estático y un formatter compartido, el estilo se discute en cada revisión y el diff se llena de cambios irrelevantes.

Esta elección es explícita del equipo: no es el default de un generador de proyectos.

## Decisión

Adoptar ESLint como linter y Prettier como formatter. El análisis estático y la comprobación de formato se invocan con los scripts del repositorio (`lint` y `format:check`).

El código ya implementa esta decisión.

## Consecuencias

### Positivas

- El estilo se aplica de forma automática y se puede exigir en local y en CI.
- ESLint y Prettier se complementan (`eslint-config-prettier` evita reglas de formato duplicadas).

### Negativas / trade-offs

- Hay que mantener las configs de ambas herramientas y resolver conflictos de versión.
- Un cambio de regla puede exigir un formateo masivo del árbol.

## Referencias

- [Coding Style Standards](../standards/coding-style.md)
- [ESLint](https://eslint.org/)
- [Prettier](https://prettier.io/)
