-- Create users table (extension of Supabase auth)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  age INTEGER,
  location TEXT,
  bio TEXT,
  job TEXT,
  image_url TEXT,
  is_online BOOLEAN DEFAULT false,
  last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create interests table
CREATE TABLE public.interests (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL
);

-- Create user interests junction table
CREATE TABLE public.user_interests (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  interest_id INTEGER REFERENCES public.interests(id) ON DELETE CASCADE,
  UNIQUE(user_id, interest_id)
);

-- Create chats table
CREATE TABLE public.chats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create chat participants junction table
CREATE TABLE public.chat_participants (
  id SERIAL PRIMARY KEY,
  chat_id UUID REFERENCES public.chats(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  UNIQUE(chat_id, user_id)
);

-- Create messages table
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chat_id UUID REFERENCES public.chats(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  image_url TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create likes (matches) table
CREATE TABLE public.likes (
  id SERIAL PRIMARY KEY,
  liker_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  likee_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(liker_id, likee_id)
);

-- Create matches view (mutual likes)
CREATE VIEW public.matches AS
  SELECT 
    a.liker_id AS user_id, 
    a.likee_id AS match_id, 
    GREATEST(a.created_at, b.created_at) AS matched_at
  FROM 
    public.likes a
  JOIN 
    public.likes b ON a.liker_id = b.likee_id AND a.likee_id = b.liker_id;

-- Create row level security policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Profiles are viewable by everyone" 
  ON public.profiles FOR SELECT 
  USING (true);

CREATE POLICY "Users can update their own profile" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = profiles.id);

-- User interests policies  
CREATE POLICY "User interests are viewable by everyone" 
  ON public.user_interests FOR SELECT 
  USING (true);

CREATE POLICY "Users can manage their own interests" 
  ON public.user_interests FOR ALL 
  USING (auth.uid() = user_interests.user_id);

-- Interests policies
CREATE POLICY "Interests are viewable by everyone" 
  ON public.interests FOR SELECT 
  USING (true);

-- Chat participants policies
CREATE POLICY "Users can view chats they participate in" 
  ON public.chat_participants FOR SELECT 
  USING (auth.uid() = chat_participants.user_id);

-- Chats policies
CREATE POLICY "Users can view their own chats" 
  ON public.chats FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_participants 
      WHERE chat_participants.chat_id = chats.id AND user_id = auth.uid()
    )
  );

-- Messages policies
CREATE POLICY "Users can view messages in their chats" 
  ON public.messages FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_participants 
      WHERE chat_participants.chat_id = messages.chat_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can send messages in their chats" 
  ON public.messages FOR INSERT 
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM public.chat_participants 
      WHERE chat_participants.chat_id = messages.chat_id AND user_id = auth.uid()
    )
  );

-- Likes policies
CREATE POLICY "Users can see who likes them" 
  ON public.likes FOR SELECT 
  USING (auth.uid() = likes.likee_id OR auth.uid() = likes.liker_id);

CREATE POLICY "Users can like others" 
  ON public.likes FOR INSERT 
  WITH CHECK (auth.uid() = likes.liker_id);

-- Functions
-- Function to create a chat between two users
CREATE OR REPLACE FUNCTION create_chat(user1_id UUID, user2_id UUID)
RETURNS UUID AS $$
DECLARE
  new_chat_id UUID;
BEGIN
  -- Check if a chat already exists between these users
  SELECT c.id INTO new_chat_id
  FROM public.chats c
  JOIN public.chat_participants p1 ON c.id = p1.chat_id AND p1.user_id = user1_id
  JOIN public.chat_participants p2 ON c.id = p2.chat_id AND p2.user_id = user2_id;
  
  -- If chat doesn't exist, create a new one
  IF new_chat_id IS NULL THEN
    INSERT INTO public.chats DEFAULT VALUES RETURNING id INTO new_chat_id;
    
    INSERT INTO public.chat_participants (chat_id, user_id)
    VALUES (new_chat_id, user1_id), (new_chat_id, user2_id);
  END IF;
  
  RETURN new_chat_id;
END;
$$ LANGUAGE plpgsql;

-- Function to check if two users match
CREATE OR REPLACE FUNCTION check_match(user1_id UUID, user2_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  match_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.matches 
    WHERE (matches.user_id = user1_id AND matches.match_id = user2_id) 
    OR (matches.user_id = user2_id AND matches.match_id = user1_id)
  ) INTO match_exists;
  
  RETURN match_exists;
END;
$$ LANGUAGE plpgsql;

-- Create an index on locations for faster searching
CREATE INDEX idx_profiles_location ON public.profiles USING gin (to_tsvector('english', location));

-- Create indexes on user_id for faster participant lookups
CREATE INDEX idx_chat_participants_user_id ON public.chat_participants(user_id);
CREATE INDEX idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX idx_likes_liker_id ON public.likes(liker_id);
CREATE INDEX idx_likes_likee_id ON public.likes(likee_id); 