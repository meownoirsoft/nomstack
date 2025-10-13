import { supabase } from '$lib/supabaseClient.js';
import { goto } from '$app/navigation';
import { setupNewUserSeedData, userHasSeedData } from '$lib/seedData.js';

// Sign up with email and password
export async function signUp(email, password, displayName) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: displayName
      }
    }
  });

  if (error) {
    throw error;
  }

  return data;
}

// Sign in with email and password
export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    throw error;
  }

  return data;
}

// Sign out
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  
  if (error) {
    throw error;
  }

  // Redirect to login page
  goto('/login');
}

// Reset password
export async function resetPassword(email) {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/reset-password`
  });

  if (error) {
    throw error;
  }
}

// Update password
export async function updatePassword(password) {
  const { error } = await supabase.auth.updateUser({
    password
  });

  if (error) {
    throw error;
  }
}

// Get current user
export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error) {
    throw error;
  }

  return user;
}

// Handle new user setup (called after email verification)
export async function handleNewUserSetup(userId) {
  try {
    console.log('Handling new user setup for:', userId);
    
    // Check if user already has seed data
    const hasData = await userHasSeedData(userId);
    
    if (hasData) {
      console.log('User already has seed data, skipping setup');
      return { success: true, message: 'User already has data' };
    }
    
    // Set up seed data for new user
    const result = await setupNewUserSeedData(userId);
    
    if (result.success) {
      console.log('✅ New user setup completed successfully');
      return { 
        success: true, 
        message: 'Welcome! Your account has been set up with sample meals and categories.',
        data: result
      };
    } else {
      console.warn('⚠️ New user setup completed with some errors:', result.errors);
      return { 
        success: false, 
        message: 'Account created but some setup failed. You can add data manually.',
        errors: result.errors
      };
    }
  } catch (error) {
    console.error('Error in new user setup:', error);
    return { 
      success: false, 
      message: 'Account created but setup failed. You can add data manually.',
      error: error.message
    };
  }
}

// Check if user needs onboarding
export async function checkUserOnboarding(userId) {
  try {
    const hasData = await userHasSeedData(userId);
    return {
      needsOnboarding: !hasData,
      hasData
    };
  } catch (error) {
    console.error('Error checking user onboarding:', error);
    return {
      needsOnboarding: true,
      hasData: false,
      error: error.message
    };
  }
}
