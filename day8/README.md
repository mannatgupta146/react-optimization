# How the Agent Backend Actually Works + Day 1 Plan

Part 1 explains the mechanics. Part 2 is what each of you builds on day one.

---

# PART 1 — How an agent works, mechanically

## 1.1 The thing everyone gets wrong first

**The LLM does not do anything.** It is a pure function: text in, text out. It cannot call an API, read a database, or send a message. It has no memory between calls.

Everything an "AI agent" appears to do is your backend code. The model's only job is to look at a situation and say *what it would like to happen next*. Your code decides whether that happens.

Once that clicks, the architecture becomes obvious. You aren't building intelligence — you're building the machinery around a text function:

- Deciding what text goes in (context assembly)
- Interpreting what comes out (tool call parsing)
- Actually doing things (execution)
- Remembering (session state)
- Recording (traces)

That machinery is the harness, and it's where your product lives.

## 1.2 One turn, start to finish

A customer sends "where's my order?" on WhatsApp. Here is every step:

**Step 1 — The event arrives.** WhatsApp POSTs to your webhook. The channel adapter normalizes it into an internal `InboundEvent` and immediately checks the idempotency key — WhatsApp retries, and a duplicate must be dropped here, not later.

**Step 2 — Identify.** From the phone number you resolve which tenant and which agent this belongs to, and derive a stable `session_key`.

**Step 3 — Load the spec.** Fetch the deployed `AgentSpec` — from Redis by content hash, falling back to Postgres. This is read-only. The runtime never modifies a spec.

**Step 4 — Load session state.** From Redis: the message history, the fields captured so far, the current node if it's a graph agent, and the accumulated cost.

**Step 5 — Retrieve knowledge.** If the spec has knowledge attached, embed the user's message and pull the top-k chunks. Keep every chunk's ID — you need it in the trace to score groundedness later.

**Step 6 — Build context.** Assemble the payload: system prompt from the spec, retrieved chunks, message history, tool definitions. Check the token budget here. If it's over, compact the oldest turns *before* calling, never after truncation has silently destroyed something.

**Step 7 — Call the model.** Stream the response. Start a timer and a span.

**Step 8 — Read what came back.** The response is one of two things:

- **Text** → the agent wants to reply. Go to step 11.
- **Tool calls** → the agent wants something done first. Go to step 9.

**Step 9 — Execute tools.** Your code runs them. Details in 1.3. Results get appended to the message history as tool results.

**Step 10 — Loop back to step 7.** The model now sees the results and decides again. This repeats until it produces text, or until you hit `max_turns` — which you must enforce, because a model that keeps calling tools forever will happily burn your entire budget overnight.

**Step 11 — Validate the output.** Before it reaches a human: does it satisfy the policy rules? Is it in a single script (your Chatzy lesson)? Does it conform to the capture schema? This is your last chance to catch something bad.

**Step 12 — Send.** Through the channel adapter.

**Step 13 — Persist.** Session state back to Redis. Trace written to Postgres — append-only, with every model call, every tool call, every chunk, the cost, and the latency breakdown.

That's it. That's an agent. Roughly 400 lines of orchestration code, and the difference between a bad agent and an excellent one is almost entirely in steps 6, 9, and 11.

## 1.3 How tools actually work

A tool has **three separate lives**, and conflating them is the most common source of bugs.

### Life 1 — Definition (a prompt, not documentation)

You send the model a JSON description of each available tool: name, description, and an input schema. The model reads this and decides whether and how to use it.

**The description is the most important string in your entire system.** It is a prompt, and it should be tuned like one. Vague descriptions produce a model that calls the wrong tool or the right tool with wrong arguments.

```
Bad:   "Gets order info."
Good:  "Look up an order by its ID. Use this when the customer
        references a specific order. Returns status, items, and
        delivery estimate. If the customer doesn't know their
        order ID, use search_orders_by_phone instead."
```

Note that the good version tells the model **when not to use it**. That single addition eliminates a large class of failures.

### Life 2 — Invocation (untrusted input)

The model responds with a tool name and a JSON object of arguments. Two things are true about this:

**It is a request, not an action.** Nothing has happened yet.

**It is untrusted.** The model will send a string where you expect an integer, a relative date like "next Tuesday", a made-up order ID, a tool name that doesn't exist. Validate the arguments against your JSON Schema before doing anything. Treat it exactly as you'd treat a request body from the public internet — because in the case of prompt injection, that's effectively what it is.

### Life 3 — Execution (your code, your credentials)

Your executor takes the validated arguments and does the work. The model never touches the network, the database, or a credential. That separation *is* your security model.

Execution involves, in order: resolve which executor type (HTTP, MCP, built-in), fetch the tenant's credentials from the vault, check the side-effect class, apply an idempotency key if it's a write, call with a timeout, and normalize the result.

### The registry

The registry maps a `ToolRef` in a spec to a concrete `ToolSpec`, scoped by tenant. Its shape:

```
ToolSpec:
  name, description          # sent to the model
  input_schema               # validation + sent to the model
  executor: http | mcp | builtin
  auth_ref                   # pointer to vault, never the secret
  timeout_ms, retry_policy
  side_effects: read | write | irreversible
```

`side_effects` drives a hard rule: anything `irreversible` — a payment, a message send, a deletion — needs either explicit confirmation in the conversation or a tenant allowlist. This is the difference between an enterprise buying your product and their security team killing the deal.

### Result formatting — an underrated lever

Whatever the API returns is rarely what the model should see. A 4000-token JSON blob buries the answer among fields nobody needs, and the model's attention is a resource you control.

Project down to what matters. Truncate lists. Convert timestamps to something readable. If a result is genuinely large, summarize it and offer a follow-up tool to fetch detail.

### Error surfacing — the highest-leverage code in your system

When a tool fails, what you return determines whether the agent recovers or spirals.

```
Useless:      {"error": "400 Bad Request"}
              → model retries identically, fails identically, loops

Recoverable:  {"error": "invalid_parameter",
               "field": "date",
               "received": "next tuesday",
               "expected": "ISO 8601, e.g. 2026-08-11",
               "hint": "Resolve relative dates first. Today is 2026-08-05."}
              → model fixes it on the next turn
```

Every tool error should say what went wrong, what was expected, and what to do differently. Budget real time on this. It moves task success more than a week of prompt tuning, and almost every competitor skips it.

### A concrete trace

```
User: "where's my order?"

→ model call 1
  ← tool_use: search_orders_by_phone({phone: "+9198..."})
→ execute: HTTP GET /orders?phone=... → 2 orders
→ format: project to [id, status, eta], drop 40 other fields
→ model call 2 (now sees the results)
  ← text: "You have two orders — one arriving tomorrow and one
           shipped today. Which one did you mean?"
→ validate: single script ✓, no policy violation ✓
→ send
```

Two model calls, one tool call, roughly 2 seconds. That's the shape of nearly every real interaction.

## 1.4 Where state lives

| What | Where | Why |
|---|---|---|
| AgentSpec | Postgres, cached in Redis by content hash | Immutable. Cache never invalidates because the hash changes when content does. |
| Session state | Redis (hot) + Postgres (write-behind) | Read and written every turn. Redis for speed, Postgres so a Redis flush isn't data loss. |
| Trace | Postgres, append-only, partitioned by month | Written once, read rarely, grows enormous. |
| Secrets | Vault, never the DB | Referenced by `auth_ref` only. |

**The runtime holds nothing in process memory between turns.** Any pod must be able to serve any turn. This is the single rule that makes horizontal scaling work later, and it's free if you follow it from the start and expensive to retrofit.

## 1.5 How features cooperate without importing each other

This will confuse the team on day three, so here's the answer in advance.

The runtime must execute tools. But `features/runtime` importing `features/tools` breaks the independence rule. The resolution is **dependency inversion**:

`app/core/protocols.py` defines an interface:

```python
class ToolExecutor(Protocol):
    async def execute(
        self, tenant_id: UUID, tool_ref: ToolRef, args: dict
    ) -> ToolResult: ...
```

- `features/runtime` imports the **protocol** from `core` and takes an executor as a constructor argument.
- `features/tools` provides a class that satisfies it.
- `main.py` (or a `deps.py`) wires the concrete one into the runtime at startup.

Runtime depends on the *shape* of a tool executor, not on the tools feature. Three consequences: you can unit-test the runtime with a fake executor and no network, the two can be split into separate services later without touching either, and `lint-imports` stays green.

The same pattern applies wherever features need each other. `core/protocols.py` and `core/specs/` are the only things everyone shares.

---

# PART 2 — Day 1

## The design of day one

Three tasks that touch **zero shared files**, so nobody blocks anybody. Each one is independently runnable and independently testable. At 6pm you merge all three and they fit together.

```
Aryan    → the web application skeleton        (FastAPI, no DB)
Mannat   → the data layer                      (Docker, Postgres, Alembic)
Hitesh   → the model client                    (pure Python, no web, no DB)
```

Hitesh's task in particular has no dependency on anything — it's a plain Python package. That's deliberate: it means all three of you produce something working on day one regardless of what the others do.

**Before anyone starts:** 15-minute call. Agree that everyone branches from `main`, PRs by 6pm, integrate at 7pm.

---

## Aryan — the application skeleton

**Goal:** a FastAPI app that starts, has config, has error handling, and serves `/health`.

**Files:** `app/main.py`, `app/config.py`, `app/api.py`, `app/core/exceptions.py`, `app/core/protocols.py`, `.env.example`, `pyproject.toml`

Reference implementations for the first four are in BACKEND.md Part 4 — use them, don't redesign.

**What you're building beyond the copy-paste:**

`core/protocols.py` — the interfaces from section 1.5. `ToolExecutor`, `SpecLoader`, `TraceEmitter`. These are empty Protocol classes today; they're the contracts that keep the features independent for the next twelve weeks. You own these.

`pyproject.toml` — ruff and import-linter config. Set the independence contract up now with the feature modules listed even though they don't exist yet.

`app/api.py` — the router aggregator. Empty for now, one line per feature later.

**Test when finished:**

```bash
fastapi dev app/main.py
curl localhost:8000/health          # → {"status":"ok"}
curl localhost:8000/docs            # → OpenAPI page loads
ruff check .                        # → clean
```

Then verify error handling works. Add a temporary route that raises `NotFoundError("Agent", "abc")`, hit it, confirm you get a 404 with `{"error": {"code": "not_found", ...}}` and not a 500 traceback. Delete the temporary route before you push.

**Done means:** the server starts on a clean clone with only `.env` filled in, `/health` and `/docs` both respond, ruff is clean, and a domain error produces a clean JSON error response.

---

## Mannat — the data layer

**Goal:** Postgres and Redis running in Docker, Alembic wired up, and one migration applied.

**Files:** `docker-compose.yml`, `app/database.py`, `app/core/base_models.py`, `alembic/env.py`, `alembic/versions/0001_*.py`

**What you're building:**

Docker Compose with `pgvector/pgvector:pg17` and `redis:7-alpine`, both with healthchecks and a named volume for Postgres.

`app/database.py` — async engine, `SessionLocal`, `Base`, and the `get_db` dependency. Reference in BACKEND.md Part 4. The important detail: `get_db` commits on success and rolls back on exception, exactly once, in that one place. No service anywhere in the codebase will ever call `commit()`.

`app/core/base_models.py` — two mixins every table will use:

```python
class TimestampMixin:      # created_at, updated_at with server defaults
class TenantMixin:         # tenant_id, indexed, non-nullable
```

Small file, but it's what makes tenant isolation automatic instead of something people remember. Every future table inherits both.

Then Alembic. `alembic init`, point `env.py` at your `Base.metadata` and the async engine, and write the first migration by hand — it does one thing: `CREATE EXTENSION IF NOT EXISTS vector`. No tables yet; tables belong to whoever owns each feature.

**Test when finished:**

```bash
docker compose up -d
docker compose ps                              # both healthy
alembic upgrade head                           # runs clean
alembic downgrade base && alembic upgrade head # reversible
docker compose exec db psql -U postgres -d agentplatform \
  -c "SELECT extname FROM pg_extension;"       # 'vector' present
redis-cli ping                                 # PONG
```

Then prove the session works: a throwaway script that opens a session, runs `SELECT 1`, and closes cleanly.

**Done means:** `docker compose up -d && alembic upgrade head` works from a clean clone with no manual steps, migrations run both directions, and pgvector is enabled.

---

## Hitesh — the model client

**Goal:** a Python module that takes messages and returns a streamed response with token counts and cost. No FastAPI, no database.

**Files:** `app/features/runtime/llm/client.py`, `types.py`, `pricing.py`, `scripts/chat.py`

**What you're building:**

A `ModelClient` class with one async method that takes a list of messages, a system prompt, and a model config, and streams back a response.

```python
class ModelClient:
    async def stream(
        self,
        system: str,
        messages: list[Message],
        config: ModelConfig,
        tools: list[dict] | None = None,
    ) -> AsyncIterator[StreamEvent]: ...
```

Your own types, not Anthropic's. `Message`, `StreamEvent`, `ModelResponse`, `Usage`. This matters: the moment your codebase is full of Anthropic SDK types, adding Gemini becomes a rewrite. Your types are the boundary.

Three things must come out of every call: the text, the token usage, and the cost in rupees. `pricing.py` is a dict of per-model input/output rates and a function that turns usage into a number. It'll be a few lines and you will use it every single day for the next year.

Handle the obvious failures: timeout, rate limit (429 → exponential backoff), and API errors. Raise your own exception types, not the SDK's.

Don't do tool calling today. Just text in, text out, streamed, with cost.

**Test when finished:**

```bash
python -m scripts.chat "explain what a REST API is in two sentences"
```

Should stream tokens to your terminal as they arrive — not appear all at once — then print something like:

```
--- 47 in / 118 out | ₹0.0089 | 1.4s ---
```

Then test the failure paths deliberately: run it with an invalid API key and confirm you get a clean error message rather than a stack trace. Set the timeout to 1ms and confirm it raises your timeout exception.

**Done means:** the script streams visibly, cost is calculated and printed, and both an auth failure and a timeout produce clean errors from your own exception types.

---

## 7pm — integration

Thirty minutes, all three on a call.

1. Merge all three PRs to `main`.
2. Fresh clone into a new directory.
3. Follow your own README: `docker compose up -d`, `pip install -r requirements.txt`, `alembic upgrade head`, `fastapi dev app/main.py`.
4. `curl localhost:8000/health` and `python -m scripts.chat "hi"`.
5. `ruff check . && lint-imports`.

If any step needs a command that isn't in the README, fix the README before you close the laptop. This is the last day the setup is small enough to document easily.

**Day 1 is successful if a fourth person could clone the repo and have everything running in ten minutes.**

---

## Day 2 preview

So each of you knows where you're heading:

- **Aryan** — `AgentSpec` and `FlowSpec` in `core/specs/`, plus content hashing. The contract everything else depends on.
- **Mannat** — the `agents` feature: five files, first real table, CRUD working in `/docs`. This becomes the reference feature everyone copies.
- **Hitesh** — tool calling in the model client: serialize tool definitions, parse `tool_use` blocks, validate arguments against schema.

Day 3 is the first convergence: Hitesh's client plus Aryan's spec plus a hardcoded tool produce one real agent turn in a terminal.
