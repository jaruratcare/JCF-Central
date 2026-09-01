import type { RequestHandler } from 'express';
import { supabase, supabaseAdmin } from '../supabaseClient';
import { findInternByEmail } from './carcinome/interns';

export const handleRequestPasswordReset: RequestHandler = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({ error: 'Email is required' });
      return;
    }

    if (!supabase) {
      res.status(503).json({ error: 'Authentication service not configured' });
      return;
    }

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false,
      },
    });

    if (error) {
      console.error('Password reset request error:', error);
      res.status(400).json({ error: error.message });
      return;
    }

    res.json({
      success: true,
      message: 'Password reset request accepted. If email delivery is configured, the code should arrive shortly.',
    });
  } catch (error) {
    console.error('Password reset request failed:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const handleLogin: RequestHandler = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const authClient = createAuthClient();
    if (!authClient || !supabaseAdmin) {
      res.status(503).json({ error: 'Authentication service not configured' });
      return;
    }

    console.log('Attempting login for:', email);

    // Use isolated auth client to authenticate credentials without polluting service role
    const { data, error } = await authClient.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Supabase auth error:', error);
      res.status(401).json({ error: error.message });
      return;
    }

    if (data.user) {
      console.log('Auth successful for user:', data.user.id);

      // Use service role client to bypass RLS when reading/writing user profiles
      const dbClient = supabaseAdmin || supabase;
      if (!dbClient) {
        res.status(503).json({ error: 'Database service not configured' });
        return;
      }

      let { data: profileData, error: profileError } = await dbClient
        .from('users')
        .select('id, name, email, department:dept_id(slug, label), role:role_id(slug, label)')
        .eq('id', data.user.id)
        .maybeSingle();

      if (!profileData || profileError) {
        console.log('Profile not found, creating default profile for user:', data.user.id);

        let deptId = null;
        let roleId = null;

        // Try to get default department (tech)
        const { data: defaultDept } = await dbClient
          .from('departments')
          .select('id')
          .eq('slug', 'tech')
          .maybeSingle();

        if (defaultDept?.id) {
          deptId = defaultDept.id;
        } else {
          // Fallback: get the first available department
          const { data: firstDept } = await dbClient
            .from('departments')
            .select('id')
            .limit(1)
            .maybeSingle();
          deptId = firstDept?.id;
        }

        // Try to get default role (member)
        const { data: defaultRole } = await dbClient
          .from('roles')
          .select('id')
          .eq('slug', 'member')
          .maybeSingle();

        if (defaultRole?.id) {
          roleId = defaultRole.id;
        } else {
          // Fallback: get the first available role
          const { data: firstRole } = await dbClient
            .from('roles')
            .select('id')
            .limit(1)
            .maybeSingle();
          roleId = firstRole?.id;
        }

        console.log('Using dept_id:', deptId, 'role_id:', roleId);

        // Derive user name from user_metadata or email
        const userMeta = data.user.user_metadata || {};
        const userName = userMeta.full_name || userMeta.name || data.user.email?.split('@')[0] || 'User';

        // Create user profile using service role (bypasses RLS)
        const profilePayload: any = {
          id: data.user.id,
          name: userName,
          email: data.user.email,
          status: 'active',
          joined_at: new Date().toISOString()
        };

        if (deptId) profilePayload.dept_id = deptId;
        if (roleId) profilePayload.role_id = roleId;

        const { data: newProfile, error: insertError } = await dbClient
          .from('users')
          .insert([profilePayload])
          .select('id, name, email, department:dept_id(slug, label), role:role_id(slug, label)')
          .single();

        if (insertError) {
          console.error('Profile creation error:', insertError);
          res.status(500).json({
            error: 'Failed to create user profile. ' + insertError.message,
            userId: data.user.id
          });
          return;
        }

        profileData = newProfile;
      }

      const userName = profileData.name || data.user.email?.split('@')[0] || 'User';
      const [firstName, ...lastNameParts] = userName.split(' ');
      const deptSlug = (profileData.department as any)?.slug || 'tech';
      const roleSlug = (profileData.role as any)?.slug || 'member';

      const user: Record<string, string> = {
        id: profileData.id,
        email: profileData.email || data.user.email,
        firstName: firstName || 'User',
        lastName: lastNameParts.join(' ') || '',
        department: deptSlug.replace(/_/g, '-'),
        role: roleSlug.replace(/_/g, '-'),
      };

      // --- Carcinome intern detection ---
      // If a Carcinome Assignee entry has a matching gmail, override role to carcinome_intern and department to carcinome.
      try {
        const intern = await findInternByEmail(profileData.email);
        if (intern) {
          user.role = 'carcinome_intern';
          user.department = 'carcinome';
          user.internName = intern.name;
        }
      } catch (err) {
        console.warn('[Login Intern Check Error]:', err);
      }
      // ----------------------------------

      console.log('Login successful for:', user.email);
      res.json({
        user,
        session: data.session,
      });
      return;
    }

    res.status(400).json({ error: 'Login failed' });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error: ' + String(error) });
  }
};

export const handleLogout: RequestHandler = async (req, res) => {
  try {
    const authClient = createAuthClient();
    if (authClient) {
      await authClient.auth.signOut();
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

