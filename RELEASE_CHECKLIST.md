# mind search release checklist

## Current baseline
- Production branch: `main`
- Stable homepage version: v0.3
- Development branch: `develop`
- Candidate: v0.4.0 stable
- Production reference commit: `370cb50110b5373e84c6731d83e0389a3ad9272a`
- Production index.html blob SHA: `0230b51de2de9ef6280c1802271431ce9731f94b`

## Before merging
- [x] Automated smoke tests passed on development candidate (2026-11-08)
- [x] Chromium test: save, reload, backup and restore journal (2026-11-08)
- [x] TXT export download verification (Chromium)
- [x] Chromium test: timer start, pause and reset (2026-11-08)
- [x] Timer 30-minute completion verification (Chromium simulated time)
- [x] Android offline app launch and journal persistence (user-confirmed)
- [ ] Additional physical-device background timer testing (post-release follow-up)
- [x] Android test: PWA install and offline load (user-confirmed)
- [ ] PWA update after a subsequent release (post-release follow-up)
- [x] Cancelled and invalid backup restore preserve records (Chromium)
- [x] Production GitHub Pages URL and preview path verified; rollback commit documented

## Rollback
If deployment causes problems, restore the previous stable `main` content from the recorded production commit using a new revert commit, then verify GitHub Pages. Do not rewrite branch history. Browser localStorage is device-local and is not rolled back by a site deployment.

## Safety
Do not modify NOW V34 or its data. Release-blocking Chromium tests and physical Android offline persistence were validated. Preview localStorage is intentionally isolated from production; export/import is required to transfer preview entries.
