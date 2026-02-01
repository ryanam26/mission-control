# GeniusForms API Integration Plan
**Created:** 2026-02-01 12:32 UTC  
**Author:** Scout 🔍  
**Status:** Planning Phase  

---

## Executive Summary

This plan outlines a comprehensive API strategy for GeniusForms that leverages our core differentiator (AI-powered form generation) while providing essential developer tools for programmatic form management and data collection.

**Key Differentiator:** GeniusForms will be the ONLY platform offering AI form generation + full developer API together.

**Timeline:** 4 weeks for MVP, 8 weeks for enhanced features, 12 weeks for complete feature set

---

## Part 1: Feature Scope & Prioritization

### PHASE 1: MVP (Weeks 1-4) — HIGH PRIORITY

#### 1.1 API Key Management System
**What:** User-generated, form-scoped API keys with rate limiting

**Features:**
- Generate/revoke API keys from dashboard
- Scope: per-form OR all-forms access
- Rate limits: 100, 500, 1K, 5K, 10K requests/day (configurable per key)
- Usage tracking dashboard
- Daily reset at midnight UTC
- Key naming/labeling for organization

**Why First:** Foundation for all other API features. Security-critical.

**Effort:** MEDIUM (2 weeks)
- New DB table: `api_keys` (key_hash, user_id, form_id, rate_limit, usage_count, last_reset)
- API key generation/validation middleware
- Usage tracking & reset cron
- Dashboard UI for key management

**Integration Points:**
- Links to existing `users` and `forms` tables
- Uses existing auth middleware patterns
- Leverages PostgreSQL/Neon + Drizzle ORM

---

#### 1.2 AI Form Generation via API
**What:** Programmatically create forms using natural language prompts

**Endpoints:**
```
POST /api/v1/forms/generate
Headers: X-API-Key: <key>
Body: {
  "prompt": "Create a customer feedback form with NPS score",
  "language": "en" (optional),
  "includeLogic": true (optional)
}

Response: {
  "formId": "abc123",
  "url": "https://geniusforms.ai/f/abc123",
  "fields": [...],
  "created": "2026-02-01T12:00:00Z"
}
```

**Why First:** This is our CORE DIFFERENTIATOR. No competitor has this.

**Effort:** SMALL (1 week)
- Existing AI generation already works in app
- Just needs API wrapper + auth
- Return created form object

**Integration Points:**
- Uses existing AI form generation service
- Validates against user's form quota
- Respects existing pay-what-you-want model

---

#### 1.3 Form CRUD via API
**What:** Create, read, update, delete forms programmatically

**Endpoints:**
```
GET    /api/v1/forms              (list user's forms)
GET    /api/v1/forms/:id          (get form details)
POST   /api/v1/forms              (create form)
PATCH  /api/v1/forms/:id          (update form)
DELETE /api/v1/forms/:id          (delete form)
GET    /api/v1/forms/:id/fields   (get form fields)
POST   /api/v1/forms/:id/fields   (add field)
PATCH  /api/v1/forms/:id/fields/:fieldId  (update field)
DELETE /api/v1/forms/:id/fields/:fieldId  (delete field)
```

**Why First:** Essential for developers to manage forms programmatically.

**Effort:** SMALL (1 week)
- Existing internal routes already handle this
- Just needs API key auth layer
- Add pagination for list endpoints

**Integration Points:**
- Wraps existing form management routes
- Uses same validation logic as web app
- Respects user quotas/permissions

---

#### 1.4 Response Retrieval API
**What:** Read form submissions programmatically

**Endpoints:**
```
GET /api/v1/forms/:id/responses
Query params:
  - limit (default: 50, max: 500)
  - offset (for pagination)
  - startDate / endDate (ISO format)
  - status (all|pending|completed)

Response: {
  "responses": [
    {
      "id": "resp_123",
      "submittedAt": "2026-02-01T10:30:00Z",
      "data": { "name": "John", "email": "john@example.com" },
      "metadata": { "userAgent": "...", "ip": "..." }
    }
  ],
  "total": 250,
  "hasMore": true
}
```

**Why First:** Essential complement to form submission. Developers need to GET data, not just POST it.

**Effort:** SMALL (1 week)
- Existing response retrieval already works
- Add pagination logic
- Add filtering by date/status
- Format as JSON API

**Integration Points:**
- Uses existing response storage
- Respects form permissions
- Same data format as web dashboard

---

### PHASE 2: Enhanced Features (Weeks 5-8) — MEDIUM PRIORITY

#### 2.1 Outbound Webhooks Enhancement
**What:** Auto-notify external systems when form is submitted

**Current State:** GeniusForms already has outbound webhooks!

**Enhancement Needed:**
- Add webhook configuration via API
- Retry logic (3 attempts with exponential backoff)
- Webhook delivery logs
- Custom headers/authentication
- Event filtering (only certain fields, or field value conditions)

**Endpoints:**
```
POST   /api/v1/forms/:id/webhooks
GET    /api/v1/forms/:id/webhooks
PATCH  /api/v1/forms/:id/webhooks/:webhookId
DELETE /api/v1/forms/:id/webhooks/:webhookId
GET    /api/v1/forms/:id/webhooks/:webhookId/logs
```

**Effort:** MEDIUM (2 weeks)
- Enhance existing webhook system
- Add configuration UI + API
- Build retry/logging infrastructure

**Integration Points:**
- Extends existing webhook functionality
- Uses existing response submission flow
- Add webhook_configs and webhook_logs tables

---

#### 2.2 Form Submission API (External)
**What:** Accept form submissions from custom HTML forms (like Formzed)

**Endpoints:**
```
POST /api/v1/forms/:id/submit
Headers: X-API-Key: <key> OR public (no key for public forms)
Body: {
  "data": {
    "name": "John Doe",
    "email": "john@example.com",
    ...any JSON structure
  },
  "metadata": {
    "source": "custom-app",
    "referrer": "https://myapp.com"
  }
}
```

**Why:** Allows developers to build custom form UIs while using GeniusForms as backend.

**Effort:** SMALL (1 week)
- Similar to existing submission handler
- Validate against form schema OR accept flexible JSON
- Return submission confirmation

**Integration Points:**
- Uses existing response storage
- Triggers existing webhooks
- Works with public or authenticated forms

---

#### 2.3 Form Analytics API Enhancement
**What:** Programmatic access to form analytics via API

**Existing Capabilities:**
- `GET /api/forms/:id/analytics` - Already exists (returns analytics data)
- `POST /api/forms/:id/analyze` - AI-powered analysis (already exists)

**What's Needed for Public API:**
```
GET /api/v1/forms/:id/analytics
Headers: X-API-Key: <key>
Query params:
  - metric (views|submissions|completionRate|avgTime)
  - startDate / endDate
  - groupBy (day|week|month)
  - format (json|csv)

Response: {
  "metric": "submissions",
  "period": "2026-01-01 to 2026-01-31",
  "data": [
    { "date": "2026-01-01", "value": 45 },
    { "date": "2026-01-02", "value": 52 },
    ...
  ],
  "total": 1250
}
```

**Why:** Developers can build custom dashboards, integrate with BI tools.

**Effort:** SMALL (1 week)
- Existing `/api/forms/:id/analytics` endpoint already aggregates data
- Just needs: API key auth wrapper, query parameter filtering, CSV export option
- No new analytics logic needed—leverage what exists

**Integration Points:**
- Wraps existing analytics endpoint with API key auth
- Uses existing aggregation logic
- May add caching layer if query performance becomes issue

---

### PHASE 3: Advanced Features (Weeks 9-12) — LOWER PRIORITY

#### 3.1 Embedding API
**What:** Programmatically generate embed codes

**Endpoints:**
```
GET /api/v1/forms/:id/embed
Query params:
  - type (iframe|script|popup|inline)
  - theme (light|dark|custom)
  - width / height (for iframe)

Response: {
  "embedCode": "<iframe src='...' />",
  "previewUrl": "https://geniusforms.ai/embed/preview/abc123"
}
```

**Why:** Simplifies embedding for developers.

**Effort:** SMALL (1 week)
- Generate embed code strings
- Template-based approach
- Already have form rendering logic

---

#### 3.2 Advanced Webhook Mapping
**What:** Field-level mapping and transformation for outbound webhooks

**Use Case:** Map GeniusForms field names to external API's expected schema (e.g., map "Full Name" → "contact.name", "Email" → "contact.email")

**Why "Advanced":** This extends Phase 2.1's outbound webhooks with payload customization, not a different direction. (Note: True "inbound webhooks" would be external systems sending events TO GeniusForms—not currently planned.)

**Effort:** MEDIUM (2 weeks)
- Field mapping UI (drag-and-drop or JSON configuration)
- Payload transformation engine
- Test payload generator
- Support for nested objects and arrays

**Integration Points:**
- Extends Phase 2.1 webhook_configs table
- Add `field_mapping` JSONB column
- Uses existing submission flow with pre-send transformation

---

#### 3.3 SDKs (Official Client Libraries)
**What:** Official SDKs for popular languages

**Languages:**
- JavaScript/TypeScript (npm)
- Python (pip)
- Ruby (gem)
- PHP (composer)

**Why:** Better DX than raw REST API.

**Effort:** LARGE (4-6 weeks)
- Build + test each SDK
- Documentation
- CI/CD for releases
- Maintenance burden

**Recommendation:** Start with JS/TS only (most demand), add others based on user requests.

---

## Part 2: Technical Architecture

### 2.1 API Structure

**Base URL:** `https://api.geniusforms.ai/v1/`  
**Alternative:** `https://geniusforms.ai/api/v1/` (simpler, no subdomain)

**Versioning:** URL-based (`/v1/`, `/v2/`), not header-based.

**Authentication:** 
```
Header: X-API-Key: gf_live_abc123...
```

**Rate Limiting:**
- Per-key limits (configurable: 100-10K/day)
- Return headers:
  ```
  X-RateLimit-Limit: 1000
  X-RateLimit-Remaining: 847
  X-RateLimit-Reset: 1643731200 (Unix timestamp)
  ```
- HTTP 429 when exceeded:
  ```json
  {
    "error": "rate_limit_exceeded",
    "message": "Daily rate limit of 1000 requests exceeded. Resets at midnight UTC.",
    "resetAt": "2026-02-02T00:00:00Z"
  }
  ```

**Error Handling:**
```json
{
  "error": "validation_error",
  "message": "Invalid form field type",
  "details": {
    "field": "question_type",
    "received": "multi_select",
    "expected": ["text", "email", "number", ...]
  }
}
```

**Standard HTTP Status Codes:**
- 200: Success
- 201: Created
- 204: Deleted
- 400: Bad Request (validation error)
- 401: Unauthorized (missing/invalid API key)
- 403: Forbidden (valid key, but lacks permission)
- 404: Not Found
- 429: Rate Limited
- 500: Server Error

---

### 2.2 Database Schema Changes

**New Tables:**

```sql
-- API Keys
-- Note: GeniusForms uses SERIAL (auto-incrementing integers) for all primary keys
CREATE TABLE api_keys (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  form_id INTEGER REFERENCES forms(id) ON DELETE CASCADE, -- NULL = all forms
  key_hash TEXT NOT NULL UNIQUE, -- SHA-256 hashed API key (deterministic for lookups)
  key_prefix TEXT NOT NULL, -- e.g., "gf_live_abc1" (first 12 chars for display)
  name TEXT, -- user-defined label
  rate_limit INTEGER NOT NULL DEFAULT 1000,
  usage_count INTEGER NOT NULL DEFAULT 0,
  last_reset_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMPTZ
);

CREATE INDEX idx_api_keys_key_hash ON api_keys(key_hash);
CREATE INDEX idx_api_keys_user_id ON api_keys(user_id);

-- Webhook Configurations
-- Note: This extends existing architecture (see Migration Path below)
CREATE TABLE webhook_configs (
  id SERIAL PRIMARY KEY,
  form_id INTEGER NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  method TEXT NOT NULL DEFAULT 'POST',
  headers JSONB DEFAULT '{}', -- custom headers
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Webhook Delivery Logs
-- Note: Existing table has different schema (see Migration Path below)
CREATE TABLE webhook_logs_v2 (
  id SERIAL PRIMARY KEY,
  webhook_config_id INTEGER REFERENCES webhook_configs(id) ON DELETE CASCADE,
  form_id INTEGER NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
  session_id TEXT,
  webhook_url TEXT NOT NULL,
  status TEXT NOT NULL, -- 'success', 'failed', 'retrying'
  response_code INTEGER,
  response_body TEXT,
  error_message TEXT,
  attempt INTEGER NOT NULL DEFAULT 1,
  delivered_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_webhook_logs_v2_config ON webhook_logs_v2(webhook_config_id);
CREATE INDEX idx_webhook_logs_v2_form ON webhook_logs_v2(form_id);
```

---

### Migration Path for Existing Webhook Architecture

**Existing Architecture (from schema.ts):**
- `forms` table has `webhookUrl` and `webhookEnabled` columns (lines 50-51)
- Existing `webhook_logs` table with columns: `id`, `formId`, `sessionId`, `webhookUrl`, `status`, `responseCode`, `errorMessage`, `createdAt`

**Migration Strategy:**

**Phase 1: Maintain Compatibility**
1. Keep existing `webhookUrl` and `webhookEnabled` on `forms` table
2. Create new `webhook_configs` table for advanced multi-webhook support
3. New `webhook_logs_v2` table maintains same columns as existing `webhook_logs` but adds `webhook_config_id` link
4. Webhook delivery code checks BOTH simple (`webhookUrl`) and advanced (`webhook_configs`) setups

**Phase 2: Gradual Migration**
1. Provide UI to "Upgrade to Advanced Webhooks" which migrates `webhookUrl` → `webhook_configs` entry
2. During migration: create `webhook_configs` row, link it, null out `webhookUrl` on form
3. Logs go to `webhook_logs_v2` with proper foreign key

**Phase 3: Deprecation (Optional, 6+ months later)**
1. Once all users migrated, deprecate `webhookUrl` column
2. Merge `webhook_logs` and `webhook_logs_v2` tables
3. Remove legacy code paths

**For MVP:** Implement Phase 1 only. This allows simple setups to keep working while advanced features (retry logic, custom headers, multiple webhooks per form) use the new architecture.

---

### 2.3 Security Considerations

1. **API Key Storage:**
   - NEVER store plain-text keys
   - Hash with **SHA-256** (deterministic, fast, allows indexed lookups)
   - Store first 12 chars (prefix) for user display: `gf_live_abc123...`
   - **Why SHA-256, not bcrypt/argon2:** API key lookups happen on EVERY request and need to be indexed for performance. Bcrypt/argon2 are salted (non-deterministic) and cannot be used for database index lookups. SHA-256 provides sufficient security for high-entropy API keys (32+ random chars) while allowing fast `key_hash` index queries.

2. **API Key Format:**
   - Prefix: `gf_live_` (production) or `gf_test_` (sandbox)
   - Random 32-character string
   - Example: `gf_live_k3j2h4g5k6j7h8g9j0k1l2m3n4o5p6q7`

3. **Rate Limiting:**
   - Track per API key, not per IP (more accurate)
   - Store in Redis for performance (or PostgreSQL if unavailable)
   - Reset daily at midnight UTC
   - Return clear error messages with reset time

4. **CORS:**
   - **Default for most API endpoints:** Block all cross-origin requests for security
   - **Exception for submission endpoints:** `/api/v1/forms/:id/submit` MUST allow CORS (enables custom form UIs on external domains)
   - **Configurable:** User can specify allowed origins in dashboard (e.g., `https://myapp.com`)
   - **Wildcard option:** For public forms, optionally allow `*` (any origin)
   - **Preflight handling:** Respond to OPTIONS requests for browser-based submissions

5. **Webhook Security:**
   - Sign webhook payloads with HMAC-SHA256
   - Include signature in `X-Webhook-Signature` header
   - User can verify signature using shared secret

---

### 2.4 Existing Codebase Integration Points

**From previous research (Part 2 of original task):**

**Current Tech Stack:**
- Backend: Express.js + TypeScript
- Database: PostgreSQL (Neon) + Drizzle ORM
- Auth: (assume existing session-based or JWT)

**Existing Capabilities to Leverage:**
✅ Full Form CRUD (internal routes)  
✅ Question Management  
✅ Response Retrieval  
✅ Outbound Webhooks (already shipping!)  
✅ AI Form Generation  
✅ File Upload API  
✅ Anonymous Form Support  

**What's Needed:**
- New middleware: `authenticateApiKey()`
- New middleware: `rateLimitCheck()`
- New routes: `/api/v1/*`
- Drizzle schema additions (api_keys, webhook_configs, webhook_logs_v2)
- API key generation utility
- Webhook retry/logging service

---

## Part 3: Competitive Differentiation

### What GeniusForms Offers That Formzed Doesn't

| Feature | Formzed | GeniusForms (Planned) |
|---------|---------|----------------------|
| **AI Form Generation via API** | ❌ No | ✅ **YES** (unique!) |
| **Form CRUD API** | ❌ No | ✅ Yes |
| **Response Retrieval** | ❌ No | ✅ Yes |
| **Submission API** | ✅ Yes | ✅ Yes |
| **Webhooks (Outbound)** | ❌ Not documented | ✅ Already shipping |
| **Webhook Payload Mapping** | ❌ No | ✅ Planned (Phase 3) |
| **Analytics API** | ❌ No | ✅ Planned (Phase 2) |
| **Form Embedding** | ✅ Yes | ✅ Planned (Phase 3) |
| **Multi-Language SDKs** | ✅ Code examples only | ✅ Planned (Phase 3) |
| **Rate Limits** | ✅ 100-10K/day | ✅ 100-10K/day (same) |

**Key Differentiators:**
1. **AI + API Together:** No one else has this. Developers can programmatically generate forms with natural language.
2. **Full Form Management:** Not just submissions — developers can CREATE, READ, UPDATE, DELETE forms.
3. **Data Retrieval:** Read submissions back out (not just write them in).
4. **Better Webhooks:** Outbound with retry logic, delivery logging, custom headers, and advanced payload mapping.

**Marketing Angle:**
> "The only form platform where developers can build AI-powered forms programmatically. Create, manage, and analyze forms via API — plus AI generation that turns 'Create a signup form' into a working form in seconds."

---

## Part 4: Effort Estimates & Timeline

### Phase 1 (MVP) — 4 weeks

| Feature | Effort | Timeline |
|---------|--------|----------|
| API Key Management | MEDIUM | Week 1-2 |
| AI Form Generation via API | SMALL | Week 2 |
| Form CRUD via API | SMALL | Week 3 |
| Response Retrieval API | SMALL | Week 4 |

**Deliverables:**
- API key dashboard
- `/api/v1/forms/*` endpoints (CRUD + AI generation)
- `/api/v1/forms/:id/responses` endpoint
- API documentation (initial)
- Postman collection

---

### Phase 2 (Enhanced) — 4 weeks

| Feature | Effort | Timeline |
|---------|--------|----------|
| Outbound Webhooks Enhancement | MEDIUM | Week 5-6 |
| Form Submission API | SMALL | Week 6 |
| Form Analytics API Enhancement | SMALL | Week 7 |

**Deliverables:**
- Webhook configuration UI + API
- External form submission endpoint
- Analytics API endpoints
- Updated documentation

---

### Phase 3 (Advanced) — 4 weeks (optional)

| Feature | Effort | Timeline |
|---------|--------|----------|
| Embedding API | SMALL | Week 9 |
| Advanced Webhook Mapping | MEDIUM | Week 10-11 |
| JavaScript/TypeScript SDK | LARGE | Week 12+ |

**Deliverables:**
- Embed code generation
- Webhook payload transformation & field mapping
- Official npm package (@geniusforms/sdk)

---

## Part 5: Developer Experience (DX)

### 5.1 Documentation

**Must-Have:**
- API reference (all endpoints, params, responses)
- Authentication guide
- Rate limiting explained
- Error codes reference
- Quickstart tutorials (Node.js, Python, cURL)
- Webhook setup guide
- SDKs documentation (when available)

**Hosting:**
- docs.geniusforms.ai (subdomain)
- Use Mintlify, GitBook, or custom (Docusaurus)

---

### 5.2 Developer Dashboard

**Features:**
- View/create/revoke API keys
- See usage metrics (requests today, rate limit)
- Test API endpoints (interactive playground)
- View webhook delivery logs
- Manage CORS origins
- View API error logs

**Location:** geniusforms.ai/dashboard/api

---

### 5.3 Onboarding Flow

1. User clicks "API Access" in dashboard
2. Intro explainer: "Build forms programmatically with AI"
3. Generate first API key (auto-named "My First Key")
4. Show quickstart code snippet:
   ```javascript
   const response = await fetch('https://geniusforms.ai/api/v1/forms/generate', {
     method: 'POST',
     headers: {
       'Content-Type': 'application/json',
       'X-API-Key': 'gf_live_...'
     },
     body: JSON.stringify({
       prompt: 'Create a customer feedback form'
     })
   });
   const form = await response.json();
   console.log('Form created:', form.url);
   ```
5. Link to full docs

---

## Part 6: Pricing Strategy

**Current Model:** Pay-what-you-want (100% free)

**API Considerations:**
- **Option A:** Keep API completely free (matches current model, maximizes adoption)
- **Option B:** Free tier (1K requests/day), paid tiers for higher limits
- **Option C:** Free for personal use, paid for commercial (hard to enforce)

**Recommendation:** **Option A** for launch.

Why:
- Matches brand (100% free)
- Removes friction for developers
- Builds user base fast
- Can always add paid tiers later based on abuse/costs

**Rate Limits:**
- Free tier: 1,000 requests/day
- Power users can request higher limits (manual approval for now)

---

## Part 7: Launch Strategy

### Pre-Launch (Week 1-2 of Phase 1)
- Build API key management
- Set up API subdomain + infrastructure
- Write initial docs (outline)

### Soft Launch (Week 3-4 of Phase 1)
- MVP endpoints live (Form CRUD + AI Generation + Responses)
- Limited beta: 20-50 developers
- Gather feedback
- Fix bugs

### Public Launch (After Phase 1 Complete)
- Announce on Twitter, Product Hunt, Hacker News
- Full documentation live
- Blog post: "Introducing the GeniusForms API: AI-Powered Forms, Now Programmable"
- Outreach to developer communities (r/webdev, Dev.to, etc.)

### Post-Launch (Phase 2+)
- Ship enhanced features based on user requests
- Case studies from beta users
- SDK releases (JS/TS first)

---

## Part 8: Success Metrics

**Track:**
1. **API Adoption:** # of API keys generated
2. **Usage:** Total API requests per day/week/month
3. **Active Developers:** # of keys used in past 30 days
4. **AI Generation via API:** % of forms created via API vs web UI
5. **Webhook Usage:** # of webhooks configured
6. **Developer Retention:** % of developers still using API after 30/90 days

**Goals (6 months post-launch):**
- 500+ active API keys
- 50K+ API requests/month
- 20%+ of forms created via API
- Featured in 3+ developer newsletters/blogs

---

## Part 9: Risks & Mitigations

### Risk 1: Abuse / Spam
**Mitigation:**
- Rate limits (1K/day default)
- Require email verification for API access
- Monitor usage patterns, flag anomalies
- Ability to revoke keys instantly

### Risk 2: API Breaking Changes
**Mitigation:**
- URL versioning (`/v1/`, `/v2/`)
- Deprecation policy: 6 months notice before removing endpoints
- Changelog + migration guides

### Risk 3: Security (API key leaks)
**Mitigation:**
- Educate users: NEVER commit keys to GitHub
- Scan for leaked keys (GitHub API, automated)
- Auto-rotate keys on suspected leak
- Allow easy key revocation

### Risk 4: Support Burden
**Mitigation:**
- Comprehensive docs reduce support tickets
- Community forum (Discord/GitHub Discussions)
- FAQ for common issues
- Email support for paid tiers (if added later)

---

## Part 10: Next Steps (Immediate Actions)

### For Ryan / Team:
1. **Approve scope:** Review this plan, confirm Phase 1 features
2. **Assign developer:** Who builds this? (1-2 engineers)
3. **Set timeline:** Commit to 4-week MVP or adjust based on resources
4. **Choose API URL:** `api.geniusforms.ai` or `geniusforms.ai/api/v1`?
5. **Beta testers:** Identify 20-50 developers for soft launch

### For Scout (Me):
1. ✅ **Planning complete** (this document)
2. **Monitor competitors:** Track if Tally/Formzed add similar features
3. **Research beta candidates:** Find developers in form/automation space
4. **Draft launch messaging:** Tweets, blog post outline, PH description

---

## Appendix: Example API Flows

### Flow 1: Developer creates form with AI, retrieves submissions

```javascript
// Step 1: Generate form with AI
const createResponse = await fetch('https://geniusforms.ai/api/v1/forms/generate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': 'gf_live_...'
  },
  body: JSON.stringify({
    prompt: 'Create an event registration form with name, email, and dietary restrictions'
  })
});

const form = await createResponse.json();
console.log('Form created:', form.url);
// => https://geniusforms.ai/f/abc123

// Step 2: Share form link with users (they fill it out)

// Step 3: Retrieve submissions
const responsesResponse = await fetch(`https://geniusforms.ai/api/v1/forms/${form.id}/responses`, {
  headers: { 'X-API-Key': 'gf_live_...' }
});

const { responses } = await responsesResponse.json();
console.log('Got', responses.length, 'submissions');
responses.forEach(r => {
  console.log(r.data.name, r.data.email, r.data.dietary_restrictions);
});
```

---

### Flow 2: Use GeniusForms as backend for custom form

```javascript
// Developer builds their own HTML form
// They POST submissions to GeniusForms API

const formData = {
  name: document.getElementById('name').value,
  email: document.getElementById('email').value,
  message: document.getElementById('message').value
};

await fetch('https://geniusforms.ai/api/v1/forms/abc123/submit', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': 'gf_live_...' // or public form, no key needed
  },
  body: JSON.stringify({ data: formData })
});

console.log('Submission saved to GeniusForms!');
```

---

### Flow 3: Webhooks to external CRM

**Setup (one-time):**
```javascript
await fetch('https://geniusforms.ai/api/v1/forms/abc123/webhooks', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': 'gf_live_...'
  },
  body: JSON.stringify({
    url: 'https://mycrm.com/api/leads',
    headers: {
      'Authorization': 'Bearer my-crm-token'
    }
  })
});
```

**Result:**  
Every form submission auto-sends to `mycrm.com/api/leads` with submission data.

---

## Conclusion

This plan provides a comprehensive roadmap for integrating a best-in-class API with GeniusForms. The phased approach allows for:
1. **Fast MVP** (4 weeks) with core differentiators (AI generation + Form CRUD)
2. **Enhanced features** (Weeks 5-8) that match/exceed competitors
3. **Advanced features** (Weeks 9-12) for power users

**Key Strengths:**
- Leverages existing GeniusForms capabilities (webhooks, AI, form management)
- Clear competitive differentiation (AI + API together)
- Pragmatic effort estimates
- Strong DX focus (docs, dashboard, onboarding)

**Ready to build when approved.**

---

**Questions for Ryan:**
1. Does Phase 1 scope feel right, or should we add/remove features?
2. Timeline: 4 weeks realistic, or should we extend?
3. API URL preference: `api.geniusforms.ai` or `geniusforms.ai/api/v1`?
4. Any specific integrations you want to prioritize (Zapier, Make, n8n)?
5. Pricing: Stay 100% free, or add paid API tiers?
