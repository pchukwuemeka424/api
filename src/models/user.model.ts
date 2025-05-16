import { supabase } from '../config/supabase';

export interface User {
  id: string;
  email: string;
  name: string;
  age?: number;
  location?: string;
  bio?: string;
  job?: string;
  image_url?: string;
  is_online?: boolean;
  last_active?: Date;
  created_at?: Date;
  updated_at?: Date;
}

export interface UserWithInterests extends User {
  interests: string[];
}

export interface CreateUserDto {
  id: string;
  email: string;
  name: string;
  age?: number;
  location?: string;
  bio?: string;
  job?: string;
  image_url?: string;
  interests?: string[];
}

export interface UpdateUserDto {
  name?: string;
  age?: number;
  location?: string;
  bio?: string;
  job?: string;
  image_url?: string;
  interests?: string[];
}

interface UserInterest {
  user_id: string;
  interest_id: number;
}

export const UserModel = {
  async create(userData: CreateUserDto): Promise<User> {
    const { interests, ...profileData } = userData;
    
    // Insert user profile
    const { data: profile, error } = await supabase
      .from('profiles')
      .insert(profileData)
      .select()
      .single();

    if (error) {
      throw new Error(`Error creating user: ${error.message}`);
    }

    // Add interests if provided
    if (interests && interests.length > 0) {
      await this.updateInterests(profile.id, interests);
    }

    return profile;
  },

  async findById(id: string): Promise<UserWithInterests | null> {
    // Get user profile
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !profile) {
      return null;
    }

    // Get user interests
    const { data: userInterests } = await supabase
      .from('user_interests')
      .select('interests(name)')
      .eq('user_id', id);

    const interests = userInterests
      ? userInterests.map((item: any) => item.interests.name)
      : [];

    return { ...profile, interests };
  },

  async findByEmail(email: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !data) {
      return null;
    }

    return data;
  },

  async update(id: string, userData: UpdateUserDto): Promise<User> {
    const { interests, ...profileData } = userData;
    
    // Update profile data
    const { data: profile, error } = await supabase
      .from('profiles')
      .update({
        ...profileData,
        updated_at: new Date()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Error updating user: ${error.message}`);
    }

    // Update interests if provided
    if (interests) {
      await this.updateInterests(id, interests);
    }

    return profile;
  },

  async delete(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Error deleting user: ${error.message}`);
    }

    return true;
  },

  async findNearby(userId: string, location: string, limit = 20): Promise<UserWithInterests[]> {
    // Get user profile to exclude their own profile
    const { data: users, error } = await supabase
      .from('profiles')
      .select('*')
      .neq('id', userId)
      .like('location', `%${location}%`)
      .limit(limit);

    if (error) {
      throw new Error(`Error finding nearby users: ${error.message}`);
    }

    // Get interests for each user
    const usersWithInterests = await Promise.all(
      users.map(async (user: User) => {
        const { data: userInterests } = await supabase
          .from('user_interests')
          .select('interests(name)')
          .eq('user_id', user.id);

        const interests = userInterests
          ? userInterests.map((item: any) => item.interests.name)
          : [];

        return { ...user, interests };
      })
    );

    return usersWithInterests;
  },

  async findAll(limit = 50, offset = 0): Promise<User[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`Error fetching users: ${error.message}`);
    }

    return data || [];
  },

  async updateInterests(userId: string, interests: string[]): Promise<void> {
    // First, get or create the interest entries
    const interestPromises = interests.map(async (interest) => {
      // Check if interest exists
      const { data: existingInterest } = await supabase
        .from('interests')
        .select('id')
        .eq('name', interest.toLowerCase())
        .single();

      if (existingInterest) {
        return existingInterest.id;
      }

      // Create new interest
      const { data: newInterest, error } = await supabase
        .from('interests')
        .insert({ name: interest.toLowerCase() })
        .select('id')
        .single();

      if (error) {
        throw new Error(`Error creating interest: ${error.message}`);
      }

      return newInterest.id;
    });

    const interestIds = await Promise.all(interestPromises);

    // Delete existing user interests
    await supabase
      .from('user_interests')
      .delete()
      .eq('user_id', userId);

    // Add new user interests
    if (interestIds.length > 0) {
      const userInterests = interestIds.map((interestId: number) => ({
        user_id: userId,
        interest_id: interestId
      }));

      const { error } = await supabase
        .from('user_interests')
        .insert(userInterests);

      if (error) {
        throw new Error(`Error adding user interests: ${error.message}`);
      }
    }
  }
}; 