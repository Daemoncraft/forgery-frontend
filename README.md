# Foundry – Frontend

Angular-20-Frontend des persistenten Browser-Management-MMOs **Foundry**:
Standalone Components, Signals, Tailwind, PWA. Spricht die REST-API des Backends.

Backend (Kotlin/Spring Boot, API-Vertrag, Spiel-Kanon, gemeinsame Doku):
https://github.com/Daemoncraft/forgery-backend

## Entwicklung

Das Frontend läuft unabhängig über den Angular Dev Server; API-Requests werden
per [proxy.conf.json](proxy.conf.json) an das lokal laufende Backend
(`http://localhost:8080`, siehe Backend-Repo `docker-compose.dev.yml`) weitergeleitet:

```bash
npm install
npm start   # ng serve --proxy-config proxy.conf.json → http://localhost:4200
```

> **Bekannter Zustand:** Das Angular-Workspace-Gerüst (`angular.json`,
> `tsconfig*.json`, `src/main.ts`, `src/index.html`, Lockfile, PWA-Konfiguration)
> ist noch nicht angelegt (Ticket FND-003 im Backlog) — `npm install`/`ng build`
> funktionieren erst danach. Der vorhandene Code unter `src/app/` (Stores,
> Interceptors, Guards, Models, Dashboard-Referenz-Feature) ist die Vorlage dafür.
> Eine CI wird eingerichtet, sobald der Build läuft.

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
