# Security Specification - French Record Pool

## Data Invariants
1. A user can only access their own profile data.
2. Tracks can only be created or modified by users with the 'admin' role (verified via an `admins` collection).
3. Subscription status can only be modified by admins.
4. Track downloads are tracked.
5. All IDs must be valid strings.

## The Dirty Dozen Payloads (Failed Cases)
1. **Identity Spoofing**: Attempt to create a user profile with someone else's UID.
2. **Privilege Escalation**: A standard user attempting to update their `subscriptionStatus` to 'admin'.
3. **Ghost Field Injection**: Adding an `isVerified` field to a track that doesn't exist in the schema.
4. **ID Poisoning**: Using a 2KB string as a track ID.
5. **PII Leak**: A non-authenticated user attempting to list the `users` collection.
6. **Orphaned Write**: Creating a favorite for a track that doesn't exist. (Handled via logic)
7. **Type Mismatch**: Sending a string for `bpm` (expected integer).
8. **Bypass Immutability**: Attempting to change the `createdAt` timestamp of a track.
9. **Global Read**: Attempting to read all user emails.
10. **Admin Self-Promotion**: A user adding themselves to the `admins` collection.
11. **Negative BPM**: Setting a BPM of -120.
12. **Malformed URL**: Sending "not-a-url" for `previewUrl`.

## The Test Runner (Conceptual)
All tests must ensure that these payloads result in `PERMISSION_DENIED`.
