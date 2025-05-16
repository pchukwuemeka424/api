import { supabase } from '../config/supabase';
import { UserModel, CreateUserDto } from './user.model';
import jwt from 'jsonwebtoken';
import ms from 'ms';

export interface SignupDto {
  email: string;
  password: string;
  name: string;
  age?: number;
  location?: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: any;
}

// List of valid email domains for testing
const VALID_EMAIL_DOMAINS = [
  'gmail.com',
  'yahoo.com',
  'hotmail.com',
  'outlook.com',
  'icloud.com',
  'aol.com',
  'protonmail.com'
];

export const AuthModel = {
  async signup(userData: SignupDto): Promise<AuthResponse> {
    try {
      console.log('Starting signup process for email:', userData.email);
      
      // Check if the email domain is valid
      const emailDomain = userData.email.split('@')[1];
      const isValidDomain = VALID_EMAIL_DOMAINS.includes(emailDomain);
      
      if (!isValidDomain) {
        console.error('Invalid email domain:', emailDomain);
        throw new Error(`Authentication error: Please use a valid email domain. Test emails and example.com are not accepted.`);
      }
      
      // Register user with Supabase Auth
      console.log('Attempting to register with Supabase Auth...');
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password
      });

      if (authError) {
        console.error('Supabase auth signup error:', authError);
        throw new Error(`Authentication error: ${authError.message}`);
      }

      console.log('Supabase auth response:', authData);

      if (!authData.user || !authData.user.id) {
        console.error('Supabase user creation failed. authData:', authData);
        throw new Error('User creation failed');
      }

      // Create user profile in the profiles table
      console.log('Creating user profile in database...');
      const createUserData: CreateUserDto = {
        id: authData.user.id,
        email: userData.email,
        name: userData.name,
        age: userData.age,
        location: userData.location
      };

      const user = await UserModel.create(createUserData);
      console.log('User profile created successfully:', user);
      
      const token = this.generateToken(user.id);
      console.log('JWT token generated successfully');

      return {
        token,
        user
      };
    } catch (error) {
      console.error('Complete signup error:', error);
      // Re-throw to be handled by controller
      throw error;
    }
  },

  async login(credentials: LoginDto): Promise<AuthResponse> {
    // Sign in with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password
    });

    if (authError) {
      throw new Error(`Authentication error: ${authError.message}`);
    }

    if (!authData.user) {
      throw new Error('Login failed');
    }

    // Get user profile
    const user = await UserModel.findById(authData.user.id);

    if (!user) {
      throw new Error('User profile not found');
    }

    // Update last active timestamp
    await supabase
      .from('profiles')
      .update({
        is_online: true,
        last_active: new Date()
      })
      .eq('id', user.id);

    const token = this.generateToken(user.id);

    return {
      token,
      user
    };
  },

  async logout(userId: string): Promise<boolean> {
    // Sign out with Supabase Auth
    const { error } = await supabase.auth.signOut();

    if (error) {
      throw new Error(`Logout error: ${error.message}`);
    }

    // Update user status
    await supabase
      .from('profiles')
      .update({
        is_online: false,
        last_active: new Date()
      })
      .eq('id', userId);

    return true;
  },

  generateToken(userId: string): string {
    const jwtSecret = process.env.JWT_SECRET || 'default_jwt_secret';
    const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

    return jwt.sign(
      { userId }, 
      jwtSecret, 
      { expiresIn: expiresIn as ms.StringValue }
    );
  },

  verifyToken(token: string): { userId: string } {
    const jwtSecret = process.env.JWT_SECRET || 'default_jwt_secret';
    
    try {
      return jwt.verify(token, jwtSecret) as { userId: string };
    } catch (error) {
      throw new Error('Invalid token');
    }
  }
}; 