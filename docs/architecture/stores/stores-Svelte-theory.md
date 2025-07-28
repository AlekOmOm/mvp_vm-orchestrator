# Svelte Stores Theory

This document outlines the fundamental concepts behind Svelte stores. For VM Orchestrator–specific dependency-injection patterns and implementation details, see `docs/architecture.md` § 5.

## Core Store Types

### 1. `writable`
A shared reactive value that can be updated from anywhere:

```javascript
import { writable } from 'svelte/store'
export const count = writable(0)
```

### 2. `readable`
A read-only value whose updates are managed internally or by an external source.

### 3. `derived`
A computed value that reacts to changes in one or more other stores.

---

This file intentionally covers **only** generic Svelte store mechanics. Refer to the main architecture documentation for guidance on the project’s dependency-injected store factories.