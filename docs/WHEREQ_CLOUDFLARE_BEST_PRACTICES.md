# WhereQ Universe — Cloudflare Best Practices

> Cross-cutting reference for every WhereQ Universe app fronted by Cloudflare.
> Written app-agnostically with **chroniq.cc** as the worked example. Currently
> lives in the chroniq.cc repo; intended to move to a centralized WhereQ repo.
>
> Context: each app runs in Docker on the shared **whereq server**, published on
> a distinct localhost port (e.g. chroniq-frontend → `localhost:8082`), and is
> exposed to the internet through a **Cloudflare Tunnel** (`cloudflared`). There
> is no public inbound port on the server — all ingress is via the tunnel.

---

## 1. How our tunnels are wired (know which model you're in)

`cloudflared` can run in two modes. **Which one you're in changes where routing
lives**, and it's the #1 source of "the DNS record exists but the site 404s".

| Mode | How it runs | Where ingress/routing lives |
|------|-------------|-----------------------------|
| **Remotely-managed** (what WhereQ uses) | `cloudflared tunnel run --token-file /etc/cloudflared/token` | Cloudflare dashboard → **Zero Trust → Networks → Tunnels → \<tunnel\> → Public Hostnames** |
| Locally-managed | `cloudflared tunnel run` with a local `config.yml` containing `ingress:` rules | The `config.yml` on the server |

Check the mode on the server:

```bash
pgrep -a cloudflared          # a --token-file invocation ⇒ remotely-managed
ls /etc/cloudflared/config.yml ~/.cloudflared/config.yml 2>/dev/null   # present ⇒ locally-managed
```

**For a remotely-managed tunnel, a hostname is served ONLY if it has a matching
Public Hostname → service entry in the dashboard.** The DNS record alone is not
enough (see §3).

---

## 2. Canonical host: pick ONE, redirect the other (apex vs www)

**Rule:** serve the app on a single canonical hostname and **301-redirect** the
other to it. Never serve identical content on both `apex` and `www` — it splits
SEO (duplicate content), analytics, and cookies.

**WhereQ default: the apex is canonical** (`chroniq.cc`, not `www.chroniq.cc`).

- The old "www must be canonical" advice existed because DNS forbids a CNAME at
  the zone apex. Cloudflare removes that limitation via **CNAME flattening**
  (§5), so apex-canonical is clean and preferred.
- Apex-canonical keeps the app config simple: `PUBLIC_BASE_URL`, `CORS_ORIGINS`,
  and the Keycloak client's **valid redirect URIs** only ever need the apex.
  Serving `www` too would force you to add `www` to all three.

---

## 3. Why `www.<app>` 404s even though its DNS record exists

Symptom: `https://<app>` works, `https://www.<app>` is unreachable, yet a
`www` DNS record is present (Type **Tunnel**, Proxied).

Cause (remotely-managed tunnel): routing is by **Public Hostname** entries, not
by the DNS record. The tunnel has Public Hostnames for the apex and `api`, but
**none for `www`**, so `cloudflared` has no ingress rule for it and answers with
its default `404`. The DNS record is necessary but **not sufficient**.

> The DNS record for a tunnel hostname is auto-created when you add a Public
> Hostname — but a record can also linger after the Public Hostname is removed,
> which is exactly the "record exists, site 404s" trap.

---

## 4. Recommended fix — redirect `www` → apex at the edge

A Cloudflare **Redirect Rule** runs in the edge redirect phase **before** the
request is ever proxied to the tunnel. So it short-circuits `www` at Cloudflare
and the tunnel/origin is never contacted:

```
browser → www.<app> → Cloudflare edge
        → Redirect Rule matches host = www.<app> → 301 → https://<app>/<same path>
        (tunnel/origin never contacted)
```

### Steps (dashboard) — use the built-in template
1. **Do NOT** add a Public Hostname for `www` on the tunnel.
2. **DNS:** leave `www` as a **Proxied** record (orange cloud). Its origin
   target is irrelevant — the edge redirect wins — so you can leave an existing
   `www` Tunnel record exactly as-is. (Swapping it for a plain proxied
   `CNAME www → <app>` is optional tidiness, not required.)
3. **Rules → Redirect Rules → Create rule → Create from template →
   "Redirect from WWW to root".** It pre-fills a **wildcard Single Redirect**
   that works without changes:
   | Field | Value |
   |-------|-------|
   | Rule name | `Redirect www to apex (301, canonical host)` |
   | If incoming requests match | **Wildcard pattern** |
   | Request URL | `https://www.*` |
   | Target URL | `https://${1}` |
   | Status code | **301 – Permanent Redirect** |
   | Preserve query string | **off** (see note) |
4. **Deploy.**

**Why "Preserve query string" stays OFF here:** the wildcard `*` in
`https://www.*` captures everything after `www.` — host **and** path **and**
query — into `${1}`, so `https://${1}` already carries the query. Ticking the
box on top of that can **duplicate** the query string. (The toggle is only
needed when the `*` sits *after* the path, e.g. `https://www.<app>/*`, where
`${1}` is just the path.)

**Prerequisite:** enable **SSL/TLS → Edge Certificates → Always Use HTTPS**, so
`http://www…` is upgraded to `https://www…` first and then matches the
`https://www.*` pattern. Cloudflare's universal cert already covers both the apex
and `*.<app>`, so TLS on `www` is fine. No tunnel, CORS, or Keycloak changes
needed — the redirect short-circuits at the edge.

### Rule-name convention
Name redirect rules `action + scope + intent`, e.g.
`Redirect www to apex (301, canonical host)` — makes the *301* and *canonical*
intent obvious in a long rule list. Avoid bare names like "www to root".

### Verified working example — chroniq.cc (2026-08)
Template **"Redirect from WWW to root"**, wildcard `https://www.*` →
`https://${1}`, **301**, preserve-query **off**. Confirmed at the edge:

```bash
curl -sI "https://www.chroniq.cc/foo?bar=1" | grep -iE 'HTTP/|location'
# HTTP/2 301
# location: https://chroniq.cc/foo?bar=1        # path + query preserved, not doubled
```

If the query is ever **missing**, enable "Preserve query string"; if **doubled**,
disable it. With the config above it passes through exactly once.

---

## 5. The apex ⓘ icon — CNAME flattening (informational, not an error)

In the DNS table the apex row (`chroniq.cc`) shows an **info ⓘ** icon:

> *"CNAME records normally can not be on the zone apex. We use CNAME flattening
> to make it possible."*

A **Tunnel** record is a CNAME under the hood (→ `<tunnel-id>.cfargotunnel.com`).
DNS forbids a CNAME at the zone apex, so Cloudflare **flattens** it — at query
time it resolves the CNAME and returns the final A/AAAA addresses, so the apex
behaves like an A record. This is **normal and expected**. Subdomains like `www`
don't show the icon because CNAMEs are always legal there.

---

## 6. Alternative — serve the app on both hosts (not recommended)

Add a Public Hostname `www.<app> → http://localhost:<port>` mirroring the apex.
`www` then serves the app directly, but you take on:
- duplicate content on two hosts (SEO/analytics/cookie split), and
- adding `https://www.<app>` to `CORS_ORIGINS`, the Keycloak client redirect
  URIs, and a `<link rel="canonical">` in the app.

More moving parts, no real benefit. If you do this anyway, **still** add the
canonical redirect or at least a canonical tag.

---

## 7. Onboarding a new app's domain — checklist

1. App container is up and published on a **unique** `localhost:<port>` (avoid
   collisions with sibling apps).
2. Tunnel **Public Hostname** for the apex → `http://localhost:<port>`
   (Proxied). Add `api.<app>` only if the API is exposed separately (chroniq
   proxies `/api` through the frontend nginx, so it does **not** need a separate
   `api` hostname — the standalone `api.chroniq.cc` record is legacy).
3. `www` → **Redirect Rule** to apex (§4). No `www` Public Hostname.
4. App config uses the **apex** everywhere: `PUBLIC_BASE_URL`, `CORS_ORIGINS`,
   Keycloak valid redirect URIs.
5. SSL/TLS mode **Full (strict)** where the origin serves TLS; for tunnel
   origins Cloudflare terminates TLS and the tunnel is already encrypted.
6. (Optional, per the dashboard's "Email cannot reach @<app>" recommendation)
   if the domain won't send/receive mail, add **SPF/DKIM/DMARC** anti-spoofing
   records: a null MX, `TXT v=spf1 -all`, and a strict `_dmarc` policy. If it
   will send mail (e.g. transactional email), publish the provider's real SPF/
   DKIM and a `p=quarantine`/`reject` DMARC.

---

## 8. TL;DR

- Remotely-managed tunnel ⇒ **Public Hostname entries decide routing**, not DNS.
- **Apex is canonical**; `www` gets a **301 Redirect Rule**, not a tunnel route.
- Redirect Rules fire **at the edge before the tunnel**, so the `www` DNS record
  can stay as-is.
- The apex ⓘ icon = **CNAME flattening**, which is normal.
