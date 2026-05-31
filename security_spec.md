# Security Specification: Tabela Táxi

## 1. Data Invariants
- `users/{email}` documents require an email, a role (either 'user' or 'admin'), a passwordHash, and a createdAt ISO timestamp.
- The default root account `admin` has administrative privileges and is locked as inexcludable.
- Only users with an assigned role of `admin` can register new users or delete existing permissions.

## 2. Dirty Dozen Payloads
Below is the test set of malicious payloads designed to challenge integrity controls:
1. Ghost field updates (attempting to write `unauthorized_field: true` during profile adjustments).
2. Blank passwords registrations.
3. Overriding role parameters on common users accounts to spoof admin privileges.
4. Injecting oversized buffers (1MB+) into the `email` string.
5. Spoofing user identity by setting a document path not matching their account email.

All payloads must be strictly blocked at structural boundaries.
