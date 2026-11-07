# mind search development plan

## Release safety
- Keep `main` as the deployed stable branch.
- Make and test changes on `develop` before merging to `main`.
- Do not modify the separate NOW V34 service or its production data.

## Priorities
1. Verify journal persistence and export behavior, including storage failure handling.
2. Verify timer pause/resume, background behavior, and completion tracking.
3. Test daily practice toggles and local date boundaries.
4. Add automated smoke checks and mobile accessibility review.
5. Design optional accounts and cloud sync only after data privacy and migration plans are agreed.
6. Add internationalization and PWA installation support.

## Current facts
- GitHub Pages is deployed from `main`.
- The current prototype stores journal and practice data in browser localStorage, not Firebase.
- GitHub connector write access was verified on 2026-11-08.

## Deployment gate
- Review diff, validate behavior, and explicitly approve release before merging to `main`.
