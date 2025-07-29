# Project Glossary

## Domain Terminology

### Command Templates
**Business domain objects** containing predefined command configurations:
- `cmd`: The shell command to execute
- `type`: Execution type (ssh, local, terminal)
- `description`: Human-readable description
- `timeout`: Execution timeout in milliseconds
- `hostAlias`: Target host identifier

**Usage**: Users select command templates to populate command forms quickly.

### UI Templates
**Svelte component templates** - the actual `.svelte` files and component markup.

**Usage**: Developer constructs for building user interfaces.

## Naming Conventions

- `commandTemplate` - Business domain object
- `template` (in Svelte context) - UI template/component
- `availableCommandTemplates` - Store property for command templates
- `useCommandTemplate()` - Function to apply command template to form