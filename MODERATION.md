# Moderation and administration

Reports are persisted with reporter, target, reason, details and status. Supported reason codes cover spam, scam, harassment, hate, nudity, violence, impersonation, misinformation, intellectual property and other concerns. The web post menu submits a real report; the admin queue reads database records.

## Permissions

| Role                | Capabilities                                                                           |
| ------------------- | -------------------------------------------------------------------------------------- |
| User/founder        | Report visible content/accounts; block and mute; manage own content                    |
| Startup owner/admin | Manage startup/team permissions and submit verification evidence                       |
| Content manager     | Publish permitted startup content; cannot grant ownership                              |
| Analyst             | Read permitted startup analytics; cannot publish or manage team                        |
| Moderator           | Read report/verification queues, apply moderated actions and review operational stats  |
| Platform admin      | Moderator capabilities plus user suspension, categories, feature flags and job retries |

Every route verifies its permission server-side. Startup roles are scoped memberships. The API protects OWNER membership from ordinary reassignment/removal and protects administrator accounts from the standard moderation suspension path.

## Review procedure

1. Review report reason, target content and context. Treat submitted details as untrusted text.
2. Select DISMISS, WARN, REMOVE_CONTENT or SUSPEND_USER and provide a meaningful note (minimum five characters).
3. The action, report resolution and audit record commit in one database transaction. Removal sets a content removal timestamp. Suspension also revokes sessions.
4. Preserve a review trail. Do not modify audit rows to conceal mistakes; record a follow-up administrative event.

WARN currently records an action/note in the moderation trail; it does not deliver a separate enforcement email. Automated moderation scoring, duplicate-report aggregation, appeals, severity/SLA assignment and moderator conflict-of-interest routing remain future work. Do not describe the queue as an automated content-safety classifier.

## Verification

Founders submit evidence; repeated pending applications are rejected. Moderators/admins review the queue and approve or reject. Approval updates the startup's persisted verification status. The badge means platform review status, not financial endorsement, investment suitability or a guarantee about a business. No identity provider or KYC service is implied.

## Operational controls

The dashboard displays actual user/reel/report/storage/job aggregates, pending verification, flags and audit entries. Job retries require administrator permission. Inspect the failure cause before retrying a malformed upload. Removing content stops future feed visibility checks; purging previously cached/CDN media requires the delivery lifecycle described in SECURITY.md.

Flags are persisted and audited. Group conversations check their flag on the API. Investment is permanently rejected when enabling it through admin. Flags reserved for future algorithms are configuration records, not evidence that a second recommendation implementation exists.
