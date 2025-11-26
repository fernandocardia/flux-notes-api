Simple API for Flux Cloud
=============

It’s a minimal REST API using **NestJS**, an **in-memory repository** and **Swagger**, for a PoC using [Flux Cloud](https://runonflux.com/fluxcloud/). Hope we`re going to see a decentralized cloud in the near future.

Stack used
----------

*   Node.js (v22)

*   NestJS (v11)

*   Swagger (OpenAPI)

*   In-memory storage (no DB)

*   Jest (unit + e2e)

*   Docker


Running locally with Docker
-------------------

Build the image:

`   docker build -t flux-notes-api .   `

Run the container:

`   docker run -d --rm --name flux-notes-api -p 3013:3000 flux-notes-api   `

> The app uses a global prefix **/v1** internally.

API & Docs
----------

http://localhost:3013


Endpoints:

*   GET / - Swagger

*   GET /v1/notes

*   POST /v1/notes

*   GET /v1/notes/:id

*   PATCH /v1/notes/:id

*   DELETE /v1/notes/:id


Local development (without Docker)
----------------------------------

Install deps:

`   npm install   `

Run:

`   npm run start:dev   `

Open Swagger UI at:

`   http://localhost:3013   `

Tests
-----

Unit tests:

`   npm run test   `

E2E tests:

`   npm run test:e2e   `