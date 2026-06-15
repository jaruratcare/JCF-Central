import { RequestHandler } from 'express';
import { supabase, supabaseAdmin } from '../supabaseClient';

export const handleChangePassword: RequestHandler = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const authToken = req.headers.authorization?.split(' ')[1];

    if (!currentPassword || !newPassword) {
      res.status(400).json({ error: 'Current and new passwords are required' });
      return;
    }

    if (newPassword.length < 8) {
      res.status(400).json({ error: 'New password must be at least 8 characters' });
      return;
    }

    if (!authToken) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    if (!supabase || !supabaseAdmin) {
      res.status(503).json({ error: 'Authentication service not configured' });
      return;
    }

    // Get current user from token
    const { data: { user }, error: userError } = await supabase.auth.getUser(authToken);

    if (userError || !user) {
      res.status(401).json({ error: 'Invalid session' });
      return;
    }

    // Verify current password by attempting to sign in
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email!,
      password: currentPassword,
    });

    if (signInError) {
      res.status(401).json({ error: 'Current password is incorrect' });
      return;
    }

    // Update password using admin client
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      { password: newPassword }
    );

    if (updateError) {
      res.status(400).json({ error: 'Failed to update password' });
      return;
    }

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
