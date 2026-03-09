# VelvetChat

Elegant, mobile-friendly chat website built with Next.js and SQLite.

## Features

- Register with email or phone
- Secure login with hashed passwords and httpOnly session cookies
- User profile with avatar, username, and status
- One-to-one chat
- Group chat creation
- Image, video, and document sharing
- Online presence updates
- Browser notifications for new messages
- Responsive chat layout for desktop and mobile

## Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Notes

- SQLite is stored in `data/chatting.sqlite`.
- Uploaded avatars and attachments are stored in `public/uploads`.
- Database access is intentionally server-side only. SQLite credentials are not exposed in the frontend because that would make the app insecure.
