# Campaign Collaboration Hub (Vercel + Airtable)

A frontend tool for writers and marketing teams to collaborate on campaigns with shared briefs, feedback tracking, and decision logging.

## Stack
- **Frontend:** HTML/CSS/Vanilla JS
- **Hosting:** Vercel
- **Data:** Airtable
- **Backend API:** Vercel Serverless Function (`/api/data`)

## Project structure
- `index.html` – UX interface
- `styles.css` – styling
- `app.js` – client behavior + API calls
- `api/data.js` – Airtable proxy (GET/POST/PATCH/DELETE)
- `vercel.json` – Vercel config

## Airtable setup
Create a base with 3 tables:

### 1) `Feedback`
Fields:
- `FBID` (single line text)
- `Section` (single line text)
- `Reviewer` (single line text)
- `Priority` (single select: P0/P1/P2)
- `Comment` (long text)
- `Status` (single select: Open/Accepted/Rejected/Needs Clarification)

### 2) `Decisions`
Fields:
- `Date` (date)
- `Decision` (long text)
- `Owner` (single line text)
- `Rationale` (long text)
- `Assets` (single line text)

### 3) `Briefs`
Fields:
- `Campaign`
- `Product`
- `Objective`
- `KPI`
- `Audience`
- `CoreMessage`
- `LaunchDate` (date)
- `DRI`
- `Status`

## Vercel environment variables
In Vercel project settings, add:
- `AIRTABLE_API_KEY`
- `AIRTABLE_BASE_ID`
- `AIRTABLE_FEEDBACK_TABLE` (optional, defaults to `Feedback`)
- `AIRTABLE_DECISION_TABLE` (optional, defaults to `Decisions`)
- `AIRTABLE_BRIEF_TABLE` (optional, defaults to `Briefs`)

## Deploy on Vercel
1. Push this repo to GitHub.
2. Import it into Vercel.
3. Add the environment variables above.
4. Deploy.

Your frontend will call `/api/data?type=feedback|decisions|brief` and persist directly to Airtable.
