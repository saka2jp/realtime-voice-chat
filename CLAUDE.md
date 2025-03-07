# CLAUDE.md - Realtime Voice Chat Project

## Commands
- **Development**: `npm run dev` (runs both client and server)
- **Build**: `npm run build` (builds both client and server)
- **Lint**: `npm run lint` (lints both client and server)
- **Client Dev**: `cd client && npm run dev`
- **Server Dev**: `cd server && npm run start:dev`
- **Client Test**: `cd client && npm run test`
- **Server Test**: `cd server && npm run test`
- **Server Single Test**: `cd server && npm run test -- -t "test name pattern"`
- **E2E Tests**: `cd server && npm run test:e2e`

## Code Style Guidelines
- **Stack**: Next.js (client), NestJS (server), TypeScript throughout
- **Naming**: Components: PascalCase, Variables/Functions: camelCase
- **Components**: Functional components with React hooks
- **Imports**: Group by: 1) React/Next, 2) External libs, 3) Internal modules
- **Types**: Explicit type annotations, avoid `any`, prefer interfaces
- **Errors**: Try/catch for async, type narrow with `instanceof Error`
- **Formatting**: ESLint for client, Prettier for server
- **WebSocket**: Follow established pattern in voice.gateway.ts
- **Environment**: Use .env files for configuration (see .env.example)