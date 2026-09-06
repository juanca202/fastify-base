---
name: Coding Style Standards
domain: coding-style
status: Active
last_update: 2026-09-06
source_adrs: [ADR-003]
tags: [coding-style, eslint, prettier]
---

# Coding Style Standards

Normas de estilo y formato del código fuente. Aplica a todo el árbol que analizan ESLint y Prettier.

## Estilo y formato

**ID:** lint-format
**Estado:** Active

El código se analiza y se formatea con las herramientas del repositorio. El análisis estático **DEBE** terminar sin errores. El código fuente **DEBE** cumplir el formateo del proyecto.

### Excepciones

Ninguna.

## Criterios de cumplimiento

| ID     | Requisito   | Descripción                                                | Origen                                       | Automatizable | Enfoque    | Verificación |
| ------ | ----------- | ---------------------------------------------------------- | -------------------------------------------- | ------------- | ---------- | ------------ |
| CR-001 | lint-format | El análisis estático **DEBE** terminar sin errores         | [ADR-003](../adr/ADR-003-eslint-prettier.md) | yes           | bloqueante | yes          |
| CR-002 | lint-format | El código fuente **DEBE** cumplir el formateo del proyecto | [ADR-003](../adr/ADR-003-eslint-prettier.md) | yes           | bloqueante | yes          |

## Referencias

- [ADR-003: ESLint y Prettier como linter y formatter](../adr/ADR-003-eslint-prettier.md)
