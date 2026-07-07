# Foundry – Frontend

Angular-22-Frontend des persistenten Browser-Management-MMOs **Foundry**:
Standalone Components, Signals, zoneless, Tailwind, PWA. Spricht die REST-API
des Backends. Package Manager ist **Bun** (`bun.lock`, kein `package-lock.json`).

Backend (Kotlin/Spring Boot, API-Vertrag, Spiel-Kanon, gemeinsame Doku):
https://github.com/Daemoncraft/forgery-backend

## Entwicklung

Das Frontend läuft unabhängig über den Angular Dev Server; API-Requests werden
per [proxy.conf.json](proxy.conf.json) an das lokal laufende Backend
(`http://localhost:8080`, siehe Backend-Repo `docker-compose.dev.yml`) weitergeleitet:

```bash
bun install
bun start        # ng serve (Proxy via angular.json) → http://localhost:4200
bun run build    # Produktions-Build → dist/foundry-frontend/browser
bun run test     # Unit-Tests (Vitest, @angular/build:unit-test)
```

> Hinweis: Die Angular-22-CLI verlangt Node.js ≥ 22.22.3 (oder ≥ 24.15 / ≥ 26)
> als Laufzeit für `ng` — Bun ersetzt npm als Package Manager/Task Runner,
> nicht die Node-Runtime der CLI.

## Referenz-Dokumente

- UI-/Frontend-Architektur: [docs/06-frontend.md](docs/06-frontend.md)
- API-Spezifikation: [forgery-backend/docs/05-api-spec.md](https://github.com/Daemoncraft/forgery-backend/blob/main/docs/05-api-spec.md)
- Spiel-Kanon (Ressourcen/Gebäude/Formeln): [forgery-backend/docs/00-canon.md](https://github.com/Daemoncraft/forgery-backend/blob/main/docs/00-canon.md)
- Art Bible: [forgery-backend/docs/10-art-bible.md](https://github.com/Daemoncraft/forgery-backend/blob/main/docs/10-art-bible.md)

## Docker

[Dockerfile](Dockerfile) baut das Produktions-Bundle und serviert es via nginx;
[nginx.conf](nginx.conf) proxyt `/api` auf den Service-Namen `backend:8080` und
setzt daher ein gemeinsames Container-Netz voraus (Produktions-Deployment) —
für die lokale Entwicklung gilt der Dev-Server-Weg oben.
