# Bumble Clone API

A RESTful API for the Bumble Clone dating app with real-time features using Supabase.

## Features

- User authentication and profile management
- Matching system
- Real-time chat with Supabase Realtime
- Message read status tracking
- Unread message counts

## Prerequisites

- Node.js 14+ and npm
- Supabase account and project

## Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/bumble-clone.git
cd bumble-clone/backend-api
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
cp .env.example .env
```
Edit the `.env` file with your Supabase credentials and other configuration.

4. Build the project
```bash
npm run build
```

5. Start the server
```bash
npm start
```

For development with auto-restart:
```bash
npm run dev
```

## Database Setup

Run the SQL schema in your Supabase project:
1. Go to your Supabase project dashboard
2. Open the SQL Editor
3. Copy and paste the contents of `supabase/schema.sql`
4. Run the script

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Create a new user account
- `POST /api/auth/login` - Log in with credentials
- `POST /api/auth/logout` - Log out the current user

### Users
- `GET /api/users/me` - Get current user profile
- `PUT /api/users/me` - Update current user profile
- `GET /api/users/:id` - Get another user's profile
- `GET /api/users/nearby` - Get users nearby by location

### Matches
- `POST /api/matches/like` - Like a user
- `DELETE /api/matches/like/:likeeId` - Remove a like
- `GET /api/matches/likes` - Get users who liked the current user
- `GET /api/matches/matches` - Get mutual matches
- `GET /api/matches/check/:otherUserId` - Check if matched with a specific user

### Chats
- `GET /api/chats` - Get all chats for the current user
- `POST /api/chats` - Create a new chat
- `GET /api/chats/:chatId` - Get a specific chat
- `GET /api/chats/unread-counts` - Get unread message counts for all chats

### Messages
- `GET /api/messages/:chatId` - Get messages for a specific chat
- `POST /api/messages` - Send a new message
- `PATCH /api/messages/:chatId/read` - Mark messages as read

### Real-time
- `GET /api/realtime/credentials` - Get Supabase credentials for real-time
- `POST /api/realtime/subscribe/chat/:chatId` - Subscribe to chat updates (server-side)

## Real-time Functionality

The API supports real-time features using Supabase's real-time capabilities:

1. Client-side subscriptions:
   - The client can use the credentials from `/api/realtime/credentials` to establish direct real-time connections with Supabase.

2. Server-side subscriptions:
   - The API includes a RealtimeService class that manages subscriptions server-side.
   - This is useful for server-side processing of real-time events.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request 