# ScreenIQ — AI-Powered Candidate Screener

A full-stack internal tool for HR teams to screen job applicants using AI. Paste a job description and resume, get an AI-generated match score with reasoning, and manage past screenings from a dashboard.

---

## Tech Stack

- **Backend:** Django 6 + Django REST Framework
- **Frontend:** Next.js 16 (App Router) + Tailwind CSS + Axios
- **Database:** PostgreSQL
- **AI:** Google Gemini (`gemini-2.0-flash-lite`)
- **Auth:** JWT via `djangorestframework-simplejwt`

---

## Setup Guide

### Prerequisites

- Python 3.11+
- Node.js 18+
- PostgreSQL running locally

### 1. Clone the repo

```bash
git clone <repo-url>
cd screeniq
```

### 2. Backend setup

```bash
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux

pip install -r requirements.txt
```

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

Run migrations and start the server:

```bash
python manage.py migrate
python manage.py runserver
```

### 3. Frontend setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:3000`, backend at `http://localhost:8000`.

---

## Bugs Fixed (Task A-1)

The starter `views.py` had the following issues:

**Bug 1 — No authentication check**
The view had no `permission_classes`, meaning any unauthenticated user could submit screenings. Fixed by adding `permission_classes = [IsAuthenticated]`.

**Bug 2 — KeyError on missing fields**
`request.data['job_description']` raises a `KeyError` if the field is missing. Fixed by using `request.data.get(...)` with explicit validation and a `400 Bad Request` response when fields are absent.

**Bug 3 — Prompt ignores the job description**
The original prompt was `"Score this resume 1-10: {resume}"` — it never used the job description, making the score meaningless. Fixed by designing a structured prompt that uses both inputs (see Prompt Design below).

**Bug 4 — Score stored as raw string**
`ai_score` was a `CharField` storing whatever the AI returned (e.g. `"Seven"`, `"7.3/10"`). This made sorting and color-coding impossible. Fixed by changing the field to `FloatField` and running the raw value through `normalize_score()` before saving.

**Bug 5 — Wrong HTTP status on success**
The view returned `HTTP_200_OK` on creation. The correct status for a newly created resource is `HTTP_201_CREATED`.

**Bug 6 — Deprecated OpenAI API usage**
`openai.ChatCompletion.create(...)` is the legacy v0 API. Fixed by using the current `openai` Python SDK (`OpenAI` client with `client.chat.completions.create(...)`) and switching to `gpt-4o-mini`.

---

## Security Vulnerability (Task A-3)

**Vulnerability: Broken Object Level Authorization**

The original `ApplicationListView` used `Application.objects.all()`, which returns every screening record in the database regardless of who created it. Any authenticated user could read every other user's screening history.

**Fix:** Filtered the queryset to only return records belonging to the requesting user:
code:
Application.objects.filter(created_by=request.user).order_by('-created_at')


## AI Prompt Design (Task A-2)

The original prompt was a single line that only used the resume and returned an unstructured string. The redesigned prompt:

- Provides both the **job description and resume** so the score reflects actual fit, not just resume quality in isolation
- Assigns a clear **role** ("You are an AI HR screening assistant") to anchor the model's behavior
- Specifies **exactly 3 reasons** to keep output consistent and scannable
- Demands **valid JSON only** with a concrete schema example, eliminating the need to parse free-form text
- Handles markdown code fences (` ```json `) that Gemini sometimes wraps responses in

The JSON-first approach was chosen over asking for plain text because it makes the response machine-readable without fragile string parsing, and fails loudly (via `json.loads`) if the model deviates from the format.

---

## State Management Decision (Task B-1)

React Context (`AuthContext`) is used for authentication state, and local `useState` is used for all form and API data on individual pages.

Redux was deliberately avoided. The application has two distinct state concerns: auth (global, persistent) and page-level data (local, transient). Context handles the global case cleanly without the boilerplate overhead of Redux. Adding Redux for this scope would be overengineering — it adds reducers, actions, and a store for problems that `useState` solves in five lines.

---

## Pagination vs Virtual Scrolling (Task B-2)

**Chosen approach: Server-side pagination**

The dashboard fetches 10 records per page from `GET /api/applications/?page=N`. The backend uses DRF's `PageNumberPagination` and returns `count`, `next`, `previous`, and `results`.

**Tradeoff:**
- Server-side pagination keeps the initial payload small regardless of total record count, making it the correct choice when data lives in a database. It scales to millions of rows with no frontend changes.
- Virtual scrolling (e.g. `react-window`) renders only visible DOM rows from a pre-loaded dataset. It solves rendering lag but still requires fetching all data upfront, which is expensive at 500+ rows and wastes bandwidth for users who never scroll to the bottom.
- The downside of server-side pagination is that it requires a network round-trip on every page turn. For an internal HR tool where users are reviewing candidates sequentially, this is an acceptable tradeoff.

---

## Score Normalisation — Frontend vs Backend (Task B-3)

**Decision: Handled in the backend (`score_utils.py`)**

The `normalize_score()` function runs on the raw AI output before the score is saved to the database. It handles:
- Integers and floats — clamped to `[1, 10]`
- Word strings like `"Seven"` — mapped via a lookup dictionary
- Strings containing numbers like `"7.3/10"` — extracted via regex

Normalising in the backend was the right call for two reasons:
1. The database should never store an invalid score. If normalisation lived in the frontend, a direct API call would bypass it and corrupt the data.
2. The frontend only needs to render a number — it should not contain business logic for interpreting AI output formats.

---

## Bias & Fairness (Task C-2)

AI screening tools can encode bias in subtle ways. A model trained on historical hiring data may learn to associate certain names, universities, or locations with positive outcomes — not because those attributes predict job performance, but because past hiring decisions were themselves biased.

**Detecting bias:**
The most direct method is an audit test: submit identical resumes with only the candidate's name changed (e.g. a traditionally Western name vs. a South Asian or African name) and compare the scores. If the model returns systematically different scores for equivalent resumes, bias is present. This can be automated by generating a test suite of resume variants across demographic proxies (name, university tier, location) and running statistical significance tests on the score distributions.

A second signal is score variance analysis across real submissions: if candidates from certain universities or cities cluster at the bottom of the score range despite comparable skills, that warrants investigation.

**Reducing bias:**
The most effective intervention at the prompt level is to explicitly instruct the model to ignore demographic signals: *"Evaluate only technical skills, relevant experience, and role-specific qualifications. Do not factor in candidate name, location, university prestige, or any demographic information."* This does not fully eliminate bias baked into the model's weights, but it reduces surface-level pattern matching.

At the system level: strip or anonymise candidate names before sending the resume to the AI. Store the raw AI reasoning alongside scores so HR reviewers can audit decisions. Periodically re-run the audit test suite as the underlying model is updated, since model updates can introduce or remove biases unpredictably. Finally, treat the AI score as one signal among many — never an automated pass/fail gate.

---

## Tests

Three tests are written in `applications/tests.py` covering the most critical paths:

1. **Score normalisation** — unit tests for `normalize_score()` covering all input types (int, float, word string, numeric string, out-of-range values)
2. **ApplicationListView isolation** — ensures a user cannot see another user's screening records
3. **ScreenCandidateView authentication** — ensures unauthenticated requests are rejected with 401

These were chosen because they cover the two security properties (auth enforcement, data isolation) and the core edge-case logic (score normalisation) that the assignment explicitly calls out.

---

## Streaming — AI Response (Task C-1)

**Approach: Next.js Route Handler streaming Gemini directly**

The `/api/stream/` Next.js route handler calls Gemini's `generateContentStream()` and pipes each chunk directly to the browser as SSE events (`data: {"chunk": "..."}\n\n`). The frontend reads the stream via `fetch` + `ReadableStream` reader, appending each chunk to state as it arrives so the raw AI output appears progressively. When the stream completes, the route parses the full JSON, saves the application via the Django `/api/screen/` endpoint, and sends a final `data: {"done": true, ...}` event which triggers the `ScoreCard`.

**Why Next.js Route Handler over Django SSE or Django Channels:**
- Django's WSGI dev server buffers `StreamingHttpResponse` — chunks don't flush until the full response is ready, defeating the purpose of streaming
- Django Channels requires Redis + ASGI setup — significant infrastructure overhead for one endpoint
- Next.js Route Handlers run on Node.js which natively supports streaming with zero extra dependencies, and the `ReadableStream` API flushes each chunk to the browser immediately as Gemini generates it

---



## Shortcuts & Known Limitations

- The Gemini client is instantiated on every request (inside the function) rather than at module level. This is intentional to ensure the API key is always read fresh from the environment, at the cost of a small per-request overhead.
- `USE_MOCK_AI=true` in `.env` enables a mock AI response for development without consuming API quota. Mock mode also simulates streaming with a character-by-character delay.
