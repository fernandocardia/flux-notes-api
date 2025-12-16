Simple Notes API for Flux Cloud
=============

It’s a minimal REST API for a PoC using [Flux Cloud](https://runonflux.com/fluxcloud/).
The goal is to benchmark requests per second on both memory and file persistence, across the instances. At the present, there`s a mininum of 3 instances per application.

Stack used
----------

*   Node.js (v22)

*   NestJS (v11)

*   Swagger (OpenAPI)

*   Notes persistence: In-memory and file storage

*   Jest (unit + e2e)

*   Docker


Running locally with Docker
-------------------

Build the image:

`docker build -t flux-notes-api .`

Run the container in default port:

`docker run -d --rm --name flux-notes-api -p 3000:3000 flux-notes-api`

> There`s a 1000 notes limit, for a custom one, please set MAX_NOTES env.

Running the container with dev mode:

-------------------

Build the image:

` docker build -f Dockerfile.dev -t flux-notes-api:dev . `

Run the container in default port:

```
docker run --rm -it \
  -p 3000:3000 \
  -v "$(pwd):/app" \
  -v /app/node_modules \
  flux-notes-api:dev
```

API & Docs
----------

http://localhost


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

`npm install`

Run:

`npm run start:dev`

Open Swagger UI at:

`http://localhost:3013`

Tests
-----

Unit tests:

`npm run test`

E2E tests:

`npm run test:e2e`