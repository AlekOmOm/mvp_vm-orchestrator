VM Orchestrator - Project Summary
VM Orchestrator is a web-based DevOps tool that provides unified command execution and log streaming across local projects and remote VMs.

Core Features
VM Management: View VM fleet with status, IP addresses, and power states
Hybrid Command Execution:
Interactive commands (like `vm create`) spawn actual terminals
Non-interactive commands stream output via WebSocket
Remote log tailing through SSH + WebSocket streaming
Project Integration: Discovers local `mkcli` projects and their make targets
Real-time Logging: Live log streaming with job history persistence
Tech Stack
Frontend: Svelte 5 (runes syntax) + shadcn-svelte + Socket.io-client
Backend: Node.js + Express + Socket.io + PostgreSQL
Infrastructure: SSH config inheritance, terminal spawning, WebSocket streaming
Architecture Highlights
Service Container: Dependency injection for better testability
Pure Clients: Separate HTTP/WebSocket clients from business logic
Module Structure: Feature-based organization (VM, Command, Job, Log modules)
SSH Integration: Automatic `~/.ssh/config` parsing for seamless VM access
Current Status
The project is in active development with core infrastructure complete (API clients, service container, VM management) and UI components being migrated to full Svelte 5 compatibility.

Primary Use Case: Eliminate terminal tab juggling for developers managing multiple VMs and projects with a single web interface for command execution and log monitoring.