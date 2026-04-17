# HelixScribe Mobile Expo scaffold

This is a functional Expo + Expo Router scaffold for the HelixScribe mobile client.

## Included screens

- Home
- Inbox submission
- Knowledge buckets
- Bucket chunks, with basic edit and delete
- Workflows V2 list
- Create workflow V2
- Workflow V2 detail, with save + test run
- Workflow run detail

## Backend endpoints already wired

- `GET /knowledge-buckets`
- `POST /inbox-untriaged/`
- `GET /chunks/?bucket_name=...`
- `POST /chunks/`
- `PATCH /chunks/{chunk_id}`
- `DELETE /chunks/{chunk_id}`
- `GET /workflow-v2/workflows`
- `POST /workflow-v2/workflows`
- `GET /workflow-v2/workflows/{workflow_id}`
- `PATCH /workflow-v2/workflows/{workflow_id}`
- `PUT /workflow-v2/workflows/{workflow_id}/schedule`
- `POST /workflow-v2/workflows/{workflow_id}/run`
- `GET /workflow-v2/workflows/{workflow_id}/runs`
- `GET /workflow-v2/runs/{run_id}`
- `DELETE /workflow-v2/runs/{run_id}`

## Setup

1. Install dependencies

```bash
npm install
```

2. Optional, copy the env example if you want to override the API URL

```bash
cp .env.example .env
```

3. Start the project

```bash
npx expo start
```

## Notes

- The default API target is `https://api.helixscribe.cloud`.
- This scaffold does not require a login screen.
- If you later want a lightweight protection layer, add `EXPO_PUBLIC_INTERNAL_API_KEY` and update `src/api/client.ts` to match your preferred header name.
- Workflow step configs and schedule config are editable as raw JSON. That keeps the mobile client flexible without rebuilding every admin control from the desktop frontend.
- The app is intentionally functional-first. The forms are straightforward and easy to extend.

## Handy next steps

- Add a share extension or quick capture flow for inbox submission.
- Add offline draft saving with Async Storage.
- Add chunk search inside a bucket.
- Add workflow duplication from the mobile list.
