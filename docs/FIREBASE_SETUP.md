# Firebase setup

1. Create a Firebase project and register a Web app.
2. Enable Authentication → Sign-in method → Email/Password.
3. Create a Cloud Firestore database.
4. Create a service-account key under Project settings → Service accounts.
5. Copy `.env.example` to `.env.local` and fill in the Firebase placeholders.
6. Run `npm install`.
7. Deploy rules and indexes with `firebase deploy --only firestore:rules,firestore:indexes`.

The Firestore collections mirror the current Supabase tables: `restaurant_settings`,
`categories`, `menu_items`, `daily_specials`, `offers`, `hero_slides`, `images`, and `admins`.
Admin documents use the Firebase Auth UID as their document ID and contain `email`,
`role` (`admin` or `owner`), and `created_at`.

The current Supabase adapter remains active until the data and authentication migration
is executed, so Firebase can be configured without taking the existing site offline.

To copy the current data into Firebase without deleting Supabase data, run:

```text
npm run migrate:firebase
```

This copies menu collections and creates matching Firebase Authentication users for
existing administrators. Existing Supabase passwords cannot be copied; administrators
will need to use Firebase's password-reset flow after the application switches to Firebase.
