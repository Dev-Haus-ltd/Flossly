# Release Readiness Report

Date: March 9, 2026  
Branches compared: `prod` vs `dev-usama`

## 1) Document name (industry standard)

This type of document is commonly called:
- Release Readiness Report
- Go-Live Readiness Tracker
- Engineering Delivery Status (for weekly stakeholder updates)

## 2) Branch snapshot

- `prod` HEAD: `b5ba270` (latest production branch commit)
- `dev-usama` HEAD: `7936ba8`
- `prod` is ahead of `dev-usama` by 1 commit: `b5ba270` (Send Price flow)
- `dev-usama` contains substantial unreleased work:
  - 75 files changed
  - ~10,173 insertions / ~809 deletions

## 3) Feature status summary

### A) In `dev-usama` and functionally advanced (not yet in `prod`)
- Meta DMS / Inbox v1
  - Meta DM inbox flows, dual OAuth handling, conversation/message models
  - DM history backfill and multiple reliability fixes for Instagram sync
  - Attachment/pagination support and UX hardening
- Meta Analytics v1
  - Frontend and backend expansion for analytics/ads data handling
  - Meta health diagnostics improved
- Google integrations v1 (partial completion)
  - Google Analytics/GSC structure and pages are added
  - Google Ads setup pages and backend models/migrations are added

### B) Blocked / external dependency
- Meta permissions/approval (external)
- Google permissions/approval (external)
- No reliable ETA can be committed until approvals are granted.

### C) Production note
- Current `prod` has notification work that is still not fully complete by business expectation.
- In this compare, `dev-usama` includes a notification routing update for `meta_dm`, but this alone is not full notification completion.

### D) Diary / charting stream
- No diary/charting file delta appears in `prod...dev-usama` right now.
- Based on current planning: diary redesign (charting, treatment plan, appointments, full patient detail flow) is pending scope alignment after the scheduled meeting.

## 4) Expected push-to-live outlook

## Confirmed first
- Before any release from `dev-usama`, merge latest `prod` commit (`b5ba270`) into `dev-usama` to avoid branch drift.

## Forecast (dependency-based)
- DMS + Meta Analytics v1:
  - Earliest push: after Meta approval + 2-3 working days of regression/UAT
- Google Analytics/GSC/Ads v1:
  - Earliest push: after Google approval + 3-5 working days of integration QA
- Diary redesign stream:
  - ETA not committed yet
  - Target estimate should be set only after the upcoming scope meeting

## 5) Suggested stakeholder message (copy-ready)

"As of March 9, 2026, `dev-usama` contains major unreleased work (Meta DMS, Meta Analytics, and Google Analytics/Ads v1 foundations). These are largely implemented to first-variant level, but go-live is blocked by external Meta/Google permission approvals, so we cannot commit a firm production date yet. Diary redesign is a separate track pending post-meeting estimation for full patient detail workflows (charting, treatment plan, appointments, and related modules)."
