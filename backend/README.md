# chroniq.cc — Backend

FastAPI + SQLAlchemy (async) + Alembic + Keycloak JWT. Part of the chroniq.cc
monorepo; see `../docs/ROADMAP.md` for the product plan.

## Layout

```
api/
  main.py            FastAPI app + router wiring
  routes/            HTTP endpoints (me_* = auth, public_* = anonymous)
  schemas/           Pydantic request/response models
  services/          slot_engine, calendar_providers, mailer, notifications,
                     keycloak_admin, token_crypto
chroniq/
  config.py          Settings (env-driven)
  database.py        Async engine + Base + get_db
  auth.py            Keycloak JWT verification (CurrentUser / CurrentUserId)
  models/            SQLAlchemy models
alembic/             Migrations (0001 = initial schema)
tests/               pytest
```

## Local development

```bash
cd backend
python -m venv .venv && . .venv/bin/activate
pip install -r requirements.txt
# or: pip install -e ".[dev]"

# Point at a database (defaults assume localhost:5432/chroniq)
export DATABASE_URL_SYNC="postgresql://chroniq:chroniq@localhost:5432/chroniq"
export DATABASE_URL="postgresql+asyncpg://chroniq:chroniq@localhost:5432/chroniq"

alembic upgrade head          # create schema
uvicorn api.main:app --reload # http://localhost:8000/docs
```

## Tests

```bash
pytest -q          # slot engine (pure) + /health smoke test — no DB required
```

## Notes

- User identity is the Keycloak `sub` UUID, stored as `keycloak_id` on every
  user-owned table.
- Double-booking is prevented by a PostgreSQL GiST exclusion constraint (needs
  the `btree_gist` extension; created in migration 0001).
- Email runs in **log-only mode** until `SMTP_HOST` is set — nothing is sent,
  messages are logged, and the booking flow still completes.
- Calendar `free_busy` / event write-back for Google + Microsoft are wired as
  interfaces; the network calls are implemented in Phase 3.
