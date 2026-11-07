# mind search release checklist

## Current baseline
- Production branch: `main`
- Stable homepage version: v0.3
- Development branch: `develop`
- Candidate: v0.4.0-beta
- Production reference commit: `370cb50110b5373e84c6731d83e0389a3ad9272a`
- Production index.html blob SHA: `0230b51de2de9ef6280c1802271431ce9731f94b`

## Before merging
- [x] Automated smoke tests passed on development candidate (2026-11-08)
- [x] Chromium test: save, reload, backup and restore journal (2026-11-08)
- [ ] TXT export download verification
- [x] Chromium test: timer start, pause and reset (2026-11-08)
- [ ] Timer background/resume and 30-minute completion verification
- [ ] Android test: PWA install, offline load and update
- [ ] Verify cancelled and invalid backup restore preserve records (tests added; await CI)
- [ ] Verify GitHub Pages deployment configuration and rollback procedure

## Rollback
If deployment causes problems, restore the previous stable `main` content from the recorded production commit using a new revert commit, then verify GitHub Pages. Do not rewrite branch history. Browser localStorage is device-local and is not rolled back by a site deployment.

## Safety
Do not modify NOW V34 or its data. Do not merge the beta until all release-blocking browser and mobile validation is completed. Current browser tests passed for the previous commit; newly added data-safety tests await CI.
