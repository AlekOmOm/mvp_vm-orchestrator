vm-orchestrator/
├── package.json
├── docker-compose.yml          # Local postgres + app
├── src/
│   ├── config/                 # Configuration layer
│   │   ├── index.js           # Main config with env overrides
│   │   ├── commands.js        # Hardcoded commands
│   │   └── database.js        # DB connection config
│   │
│   ├── core/                  # Business logic abstractions
│   │   ├── interfaces/        # Contract definitions
│   │   │   ├── IJobExecutor.js
│   │   │   ├── IJobStorage.js
│   │   │   └── ICommandRegistry.js
│   │   │
│   │   ├── services/          # Core business services
│   │   │   ├── JobService.js          # Job lifecycle management
│   │   │   ├── CommandService.js      # Command execution orchestration
│   │   │   └── StreamingService.js    # WebSocket event handling
│   │   │
│   │   └── models/            # Domain objects
│   │       ├── Job.js
│   │       ├── Command.js
│   │       └── LogEntry.js
│   │
│   ├── infrastructure/        # External dependencies
│   │   ├── database/
│   │   │   ├── migrations/    # Schema evolution
│   │   │   ├── repositories/  # Data access layer
│   │   │   │   ├── JobRepository.js
│   │   │   │   └── LogRepository.js
│   │   │   └── connection.js
│   │   │
│   │   ├── executors/         # Command execution implementations
│   │   │   ├── LocalExecutor.js       # spawn() implementation
│   │   │   ├── SSHExecutor.js         # SSH command execution
│   │   │   └── MockExecutor.js        # For testing
│   │   │
│   │   └── registries/        # Command discovery implementations
│   │       ├── HardcodedRegistry.js   # Default implementation
│   │       ├── MkcliRegistry.js       # Future implementation
│   │       └── SSHConfigRegistry.js   # Future implementation
│   │
│   ├── api/                   # HTTP/WebSocket interface
│   │   ├── routes/
│   │   │   ├── jobs.js        # REST endpoints
│   │   │   └── health.js      # System health
│   │   │
│   │   ├── websocket/
│   │   │   ├── handlers/      # WebSocket event handlers
│   │   │   │   ├── jobEvents.js
│   │   │   │   └── systemEvents.js
│   │   │   └── middleware/    # Auth, validation, etc.
│   │   │
│   │   └── server.js          # Express + Socket.io setup
│   │
│   ├── utils/                 # Shared utilities
│   │   ├── logger.js          # Structured logging
│   │   ├── validators.js      # Input validation
│   │   └── errors.js          # Custom error types
│   │
│   └── app.js                 # Dependency injection container
│
├── frontend/                  # Svelte application
│   ├── src/
│   │   ├── lib/               # Shared components & utilities
│   │   │   ├── components/    # Reusable UI components
│   │   │   │   ├── JobRunner.svelte
│   │   │   │   ├── LogViewer.svelte
│   │   │   │   └── CommandList.svelte
│   │   │   │
│   │   │   ├── stores/        # Svelte stores
│   │   │   │   ├── jobs.js
│   │   │   │   ├── connection.js
│   │   │   │   └── commands.js
│   │   │   │
│   │   │   └── services/      # Frontend business logic
│   │   │       ├── WebSocketService.js
│   │   │       ├── JobService.js
│   │   │       └── CommandService.js
│   │   │
│   │   ├── routes/            # SvelteKit routing (future)
│   │   │   └── +page.svelte   # Main dashboard
│   │   │
│   │   └── app.js            # Main app component
│   │
│   ├── static/               # Static assets
│   ├── vite.config.js        # Build configuration
│   └── package.json
│
├── database/
│   ├── migrations/           # SQL schema versions
│   │   ├── 001_initial.sql
│   │   └── 002_add_indexes.sql
│   │
│   └── seeds/               # Test data
│       └── dev_data.sql
│
├── scripts/                 # Development utilities
│   ├── setup.sh            # Initial project setup
│   ├── migrate.js          # Database migration runner
│   └── seed.js             # Test data seeder
│
└── tests/                  # Test structure mirrors src/
    ├── unit/
    ├── integration/
    └── e2e/