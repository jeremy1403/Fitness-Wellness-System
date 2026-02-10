# API Documentation (Scramble)

Scramble generates OpenAPI docs from the Laravel routes and request/response definitions.

## Endpoints
- UI: `/docs/api`
- OpenAPI JSON: `/docs/api.json`

## Access Control
Documentation access is restricted by the `viewApiDocs` gate.
- Allowed in `local` environment
- Allowed for authenticated users with the `admin` role

## Scope
- API routes under `api/v1` are documented (see `config/scramble.php`).

## Environment
- Optional: set `API_VERSION` in `.env` to override the default version shown in the docs.

## Setup
- Install dependencies: `composer update dedoc/scramble`
- Run the backend as usual: `php artisan serve`
