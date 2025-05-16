import { supabase } from '../config/supabase';
import { UserModel, UserWithInterests } from './user.model';

export interface Like {
  id: number;
  liker_id: string;
  likee_id: string;
  created_at: Date;
}

export interface Match {
  user_id: string;
  match_id: string;
  matched_at: Date;
}

export const MatchModel = {
  async createLike(likerId: string, likeeId: string): Promise<{ liked: boolean; isMatch: boolean }> {
    // Check if user already liked this person
    const { data: existingLike } = await supabase
      .from('likes')
      .select('*')
      .eq('liker_id', likerId)
      .eq('likee_id', likeeId)
      .single();

    if (existingLike) {
      return { liked: false, isMatch: false };
    }

    // Create the like
    const { error } = await supabase
      .from('likes')
      .insert({
        liker_id: likerId,
        likee_id: likeeId
      });

    if (error) {
      throw new Error(`Error creating like: ${error.message}`);
    }

    // Check if it's a match (the other person already liked this user)
    const { data: matchData } = await supabase
      .rpc('check_match', { user1_id: likerId, user2_id: likeeId });

    const isMatch = matchData || false;

    // If it's a match, create a chat room for them
    if (isMatch) {
      await supabase.rpc('create_chat', { user1_id: likerId, user2_id: likeeId });
    }

    return { liked: true, isMatch };
  },

  async removeLike(likerId: string, likeeId: string): Promise<boolean> {
    const { error } = await supabase
      .from('likes')
      .delete()
      .eq('liker_id', likerId)
      .eq('likee_id', likeeId);

    if (error) {
      throw new Error(`Error removing like: ${error.message}`);
    }

    return true;
  },

  async getLikes(userId: string): Promise<UserWithInterests[]> {
    // Get user IDs that have liked the current user
    const { data: likes, error } = await supabase
      .from('likes')
      .select('liker_id')
      .eq('likee_id', userId);

    if (error) {
      throw new Error(`Error fetching likes: ${error.message}`);
    }

    if (!likes || likes.length === 0) {
      return [];
    }

    // Get user details for each liker
    const likerIds = likes.map(like => like.liker_id);
    const likers = await Promise.all(
      likerIds.map(id => UserModel.findById(id))
    );

    return likers.filter(Boolean) as UserWithInterests[];
  },

  async getMatches(userId: string): Promise<{ match: UserWithInterests; matchedAt: Date }[]> {
    // Get matches from the view
    const { data: matches, error } = await supabase
      .from('matches')
      .select('match_id, matched_at')
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Error fetching matches: ${error.message}`);
    }

    if (!matches || matches.length === 0) {
      return [];
    }

    // Get user details for each match
    const matchesWithProfiles = await Promise.all(
      matches.map(async match => {
        const user = await UserModel.findById(match.match_id);
        if (!user) return null;
        
        return {
          match: user,
          matchedAt: new Date(match.matched_at)
        };
      })
    );

    return matchesWithProfiles.filter(Boolean) as { match: UserWithInterests; matchedAt: Date }[];
  },

  async hasLiked(likerId: string, likeeId: string): Promise<boolean> {
    const { data } = await supabase
      .from('likes')
      .select('id')
      .eq('liker_id', likerId)
      .eq('likee_id', likeeId)
      .single();

    return !!data;
  },

  async isMatch(user1Id: string, user2Id: string): Promise<boolean> {
    const { data } = await supabase
      .rpc('check_match', { user1_id: user1Id, user2_id: user2Id });

    return !!data;
  }
}; 