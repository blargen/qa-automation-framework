# JSONPlaceholder: what actually persists

> **On voice:** written by me, Eben Smith. Throughout `docs/`, *I* and *my* mean the author.
> The AI assistant is always named.

**Nothing does.** Every write endpoint returns a success status and a convincing response
body, and none of it changes the server. This is the single most important fact about the
API under test, and every decision in `tests/api/` follows from it.

Verified against the live API on 2026-09-10. Re-verify with the commands at the bottom
rather than trusting this table if something looks wrong.

## Verified behaviour

| Request | Status | Response body | Persists |
| --- | --- | --- | --- |
| `POST /posts` | `201` | The submitted fields echoed back, plus `id: 101` | No |
| `PUT /posts/1` | `200` | The full replacement echoed back, with `id: 1` | No |
| `PATCH /posts/1` | `200` | The **original stored record** with the change merged in | No |
| `DELETE /posts/1` | `200` | `{}` | No |
| `GET /posts/101` | `404` | `{}` | — |
| `GET /posts/999` | `404` | `{}` | — |
| `GET /posts?userId=1` | `200` | 10 posts, all `userId: 1` | — |
| `GET /posts?userId=99` | `200` | `[]` — not a `404` | — |

**Proof of non-persistence:** after issuing both a `PUT` and a `PATCH` against `/posts/1`
that returned `200` with the new title, `GET /posts/1` still returned the original title
(`sunt aut facere repellat provident occaecati...`).

## The fake id is computed, not allocated

`POST` returns **collection size + 1**, every time. It is not a counter, and nothing is
reserved:

| Resource | Collection size | `POST` returns |
| --- | --- | --- |
| `/posts` | 100 | `id: 101` |
| `/comments` | 500 | `id: 501` |
| `/users` | 10 | `id: 11` |
| `/albums` | 100 | `id: 101` |
| `/todos` | 200 | `id: 201` |

Two consecutive `POST`s to `/posts` both returned `101`. So the returned id is deterministic
and safe to assert against — but it identifies nothing. `GET /posts/101` is a `404`.

## `PATCH` reads the real record

Worth knowing because it is genuinely surprising: `PATCH /posts/1` with `{"title":"patched"}`
came back carrying the *stored* `body` and `userId` for post 1, with only the title changed.
The server reads the actual record and merges — it simply declines to save the result. So a
`PATCH` response is a legitimate source of truth about current stored state, while a `POST`
or `PUT` response is only an echo of what was sent.

## What this means for tests

**Never assert persistence.** The obvious test — create a resource, then fetch it to confirm
— is wrong here in a specific and dangerous way. It does not merely fail; depending on how
it is written it can *pass for the wrong reason*, because the API cheerfully returns `201`
and a well-formed body. A suite full of green write tests that verify nothing is worse than
no write tests at all.

```
POST /posts  ->  201, { ...sent, id: 101 }   looks like a successful create
GET /posts/101  ->  404                      nothing was created
```

**Assert the contract instead.** Since a write cannot be confirmed by reading it back, the
response is the only evidence available, so it has to be checked exhaustively:

- the status code is exactly right (`201` for create, not merely 2xx)
- the response body matches the schema strictly, with no unexpected fields
- the echoed values equal what was submitted
- the assigned id matches the documented `collection size + 1` rule
- for `PATCH`, the untouched fields still carry the stored values

**Assert the limitation itself.** The suite contains tests that confirm a `POST` does *not*
create anything and a `DELETE` does *not* remove anything. These document the API's real
behaviour and would turn red if JSONPlaceholder ever became a real backend, which is exactly
the signal a future maintainer would want.

**Consequence for framework design.** This is why API clients in `src/api/` return
`{ status, headers, body: unknown, text }` and never assert or parse. A client that threw on
a non-2xx response could not test the `404`s above, and a client that parsed internally would
turn a contract violation into a client crash instead of a readable assertion failure. See
`.claude/skills/page-object-model/SKILL.md`.

## Re-verifying

```bash
B=https://jsonplaceholder.typicode.com
curl -s -w '\n%{http_code}\n' -X POST "$B/posts" \
  -H 'Content-Type: application/json' -d '{"userId":1,"title":"t","body":"b"}'
curl -s -w '\n%{http_code}\n' "$B/posts/101"
curl -s -X PUT "$B/posts/1" -H 'Content-Type: application/json' \
  -d '{"userId":1,"title":"updated","body":"b"}'
curl -s "$B/posts/1"
```

If the last command ever returns `updated`, this document is out of date and a good deal of
`tests/api/` needs rethinking.
