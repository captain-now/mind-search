# Anonymous public board — setup and safety

**Status:** implementation staged on development branch; public backend NOT configured or deployed. Existing board remains local-only until activated.

## Architecture
- Supabase Auth anonymous sign-in silently issues a per-browser authenticated user ID.
- Visitors choose a visible nickname; **nicknames are not credentials** and are not used for ownership.
- Post and comment records carry `author_id = auth.uid()`; Postgres Row Level Security (RLS) enforces author-only deletion. No UPDATE privileges.
- All user text is inserted into the DOM via `textContent`, not `innerHTML`.
- Anonymous auth is device/session-bound. Clearing browser storage or changing devices can remove the ability to delete earlier posts; explain this prominently.
- Local board data is separate and is **not** automatically uploaded.

## Activate (requires owner-managed Supabase project)
1. Create Supabase project; enable **Anonymous Sign-ins** in Authentication.
2. Execute `database/anonymous-board.sql` in SQL Editor. Verify RLS is enabled and ownership policies work using **two different anonymous sessions**.
3. Add Supabase JS v2 script to the page before `public-board.js` and define `window.MIND_SEARCH_BOARD_CONFIG={url:'https://YOUR_PROJECT.supabase.co',anonKey:'YOUR_PUBLISHABLE_ANON_KEY'}`. Publishable key only; **never** expose service_role or database credentials.
4. Before public release: enable CAPTCHA/bot protection for anonymous sign-ins, apply rate limits and abuse reporting/moderation, establish retention/deletion rules, review privacy notice, and run two-user create/read/delete and cross-user deletion-denied tests.
5. Update local-only notice and language localization after real backend validation. Keep the draft PR unmerged until approved.

## Limitations / launch blockers
- No Supabase project credentials configured, so no shared board is live.
- Anonymous identity is not portable by default and can be lost when browser data is cleared.
- No abuse reporting, spam prevention, moderation or pagination beyond 50 posts and 500 comments yet.
- The public adapter is a first implementation, **not yet browser-tested** against a real Supabase instance.
- The current local prototype permits local deletion without identity proof; it must never be described as a secure public board.
