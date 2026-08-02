# Keycloak Setup — chroniq.cc

chroniq.cc authenticates against the shared Keycloak at `https://www.keytomarvel.com`,
using its own realm **`chroniq.cc`**. This doc covers importing the realm and the
post-import steps, and how to reuse the realm JSON as a **base template** for
onboarding other apps.

The app-specific configuration lives in [`keycloak/chroniq.cc-realm.json`](../keycloak/chroniq.cc-realm.json):

| Item | Value |
|---|---|
| Realm | `chroniq.cc` |
| SPA client (public, PKCE) | `chroniq-spa` |
| Backend client (confidential, service account) | `chroniq-backend` |
| Realm roles | `ch-admin`, `ch-tier-1`, `ch-tier-2`, `ch-tier-unlimited` |
| Login theme | `k2m-theme-chroniq` |
| Locales | en, zh, fr, ja, ko, de, es, it |

> **What the JSON does *not* cover:** SMTP, the Google/WeChat identity providers,
> avatar mappers, and theme deployment. Those are handled realm-agnostically by the
> **`onboard-realm`** skill in `KeyToMarvel.com/.claude/skills/onboard-realm`. Run
> that after (or before) importing this JSON — the two are complementary: this JSON
> owns the app's clients + roles; the skill owns realm login settings + IdPs + SMTP.

---

## 1. Import the realm

**Admin console:** Realm selector → **Create realm** → *Resource file* → upload
`keycloak/chroniq.cc-realm.json` → **Create**.

**Or via `kcadm.sh`** (inside the Keycloak container):
```bash
# PROD container = keycloak-k2m ; WSL = docker-keycloak-1
docker cp keycloak/chroniq.cc-realm.json keycloak-k2m:/tmp/chroniq-realm.json
docker exec keycloak-k2m /opt/keycloak/bin/kcadm.sh create realms \
  -s realm=chroniq.cc -f /tmp/chroniq-realm.json \
  --server http://localhost:8080 --realm master --user admin
```

Import is safe to re-run only on a fresh realm; to update an existing realm, edit
objects in place or delete the realm first.

## 2. Post-import steps (required)

1. **Regenerate the backend secret.** The JSON ships a placeholder
   (`CHANGE_ME_REGENERATE_AFTER_IMPORT`). Go to **Clients → chroniq-backend →
   Credentials → Regenerate**, copy it, and set it in the backend env:
   ```
   KEYCLOAK_ADMIN_CLIENT_ID=chroniq-backend
   KEYCLOAK_ADMIN_CLIENT_SECRET=<paste>
   ```
2. **Verify the service-account role mapping.** Clients → chroniq-backend →
   *Service account roles* should show `realm-management: manage-users, view-realm`
   (the JSON wires these via the `service-account-chroniq-backend` user). These let
   the backend look up and assign `ch-tier-*` roles after payment.
3. **Confirm the login theme** `k2m-theme-chroniq` is deployed to Keycloak (build +
   deploy the theme JAR from `KeyToMarvel.com-theme/k2m-theme-chroniq`). If it isn't
   deployed yet, temporarily set the realm login theme to `k2m-theme-vegeta`.
4. **SMTP / Google / WeChat / avatar:** run the `onboard-realm` skill against
   `REALM=chroniq.cc` (or configure manually).

## 3. App configuration

Backend (`.env` / Docker env) and frontend (build args) — already the defaults in
`docker/docker-compose*.yml`:
```
KEYCLOAK_URL=https://www.keytomarvel.com
KEYCLOAK_REALM=chroniq.cc
KEYCLOAK_CLIENT_ID=chroniq-spa
KEYCLOAK_ADMIN_CLIENT_ID=chroniq-backend
KEYCLOAK_ADMIN_CLIENT_SECRET=<from step 2.1>
```

## 4. How auth works here

- Frontend uses `keycloak-js` with `onLoad: 'check-sso'` + `pkceMethod: 'S256'`
  (`frontend/src/auth/`), so anonymous visitors load the app; the calendar
  workspace / dashboard require sign-in, public booking pages never do.
- Backend (`chroniq/auth.py`) verifies RS256 JWTs via the realm's JWKS and checks
  `azp == chroniq-spa`. Identity = the `sub` UUID, stored as `keycloak_id`.
- `fullScopeAllowed` on the SPA client puts realm roles in `realm_access.roles`, so
  `useAuth().roles` / `has_role()` see `ch-admin` / `ch-tier-*`.

---

## 5. Reusing this JSON as a base for another app

This realm is deliberately generic in structure. To onboard a new app `foo.com`:

1. Copy the file: `cp keycloak/chroniq.cc-realm.json foo.com-realm.json`.
2. Find/replace, keeping the pattern consistent:
   | From | To |
   |---|---|
   | realm `chroniq.cc` | `foo.com` |
   | `chroniq-spa` / `chroniq-backend` | `foo-spa` / `foo-backend` |
   | role prefix `ch-` | your app prefix (e.g. `foo-`) |
   | URLs `https://chroniq.cc`, `http://localhost:5173` | your app's prod + dev URLs |
   | `service-account-chroniq-backend` | `service-account-foo-backend` |
   | login theme `k2m-theme-chroniq` | your app's theme (or `k2m-theme-vegeta`) |
   | `supportedLocales` / `defaultLocale` | the app's locales |
3. Import, then do the post-import steps (§2). Run the `onboard-realm` skill for
   SMTP/IdPs/avatar.

Keep `ch-admin` (admin bypass) and the tier roles as the standard shape so the
shared backend patterns (`keycloak_admin.assign_realm_role`, Stripe→role webhook)
port with only a prefix change.
