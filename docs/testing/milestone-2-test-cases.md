# Milestone 2 – Test Cases

## Validation unit tests to add/execute
- Reject non-object payload.
- Reject unsupported connector ID.
- Reject blank or too-short name and name >80 characters.
- Reject invalid tenant UUID.
- Reject missing config / array config.
- Reject config containing password, token, secret, private-key or credential fields.
- Reject config >8 KB.
- Accept secret reference only, bounded to 200 characters, no line breaks.

## API / RLS tests
- Unauthenticated GET/POST/PATCH/DELETE returns 401.
- Non-member cannot list or create for another tenant.
- Viewer/Operator cannot create/update.
- Designer can create/update, but cannot delete.
- Admin/Owner can delete.
- Tenant A cannot see or mutate Tenant B records.
- Missing 0002 migration produces actionable error.
- Status values outside draft/active/disabled are rejected.
- Malicious input and unexpected JSON produce safe error responses.

## UI acceptance
- Catalogue selection changes form configuration.
- Save creates Draft profile.
- Registry refresh shows created profile.
- Enable/disable changes status.
- Delete asks for confirmation.
- Loading and error states are readable.
- No credential value is shown or persisted.
