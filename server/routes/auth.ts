import { RequestHandler } from 'express';
import { supabase, supabaseAdmin } from '../supabaseClient';

export const handleLogin: RequestHandler = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    if (!supabase) {
      res.status(503).json({ error: 'Authentication service not configured' });
      return;
    }

    console.log('Attempting login for:', email);

    const { data, error } = await supabase.auth.signInWithPassword({
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
      let { data: profileData, error: profileError } = await supabaseAdmin
        .from('users')
        .select('id, name, email, department:dept_id(slug, label), role:role_id(slug, label)')
        .eq('id', data.user.id)
        .single();

      if (profileError) {
        console.log('Profile not found, creating default profile for user:', data.user.id);

        let deptId = null;
        let roleId = null;

        // Try to get default department (tech)
        const { data: defaultDept } = await supabaseAdmin
          .from('departments')
          .select('id')
          .eq('slug', 'tech')
          .single();

        if (defaultDept?.id) {
          deptId = defaultDept.id;
        } else {
          // Fallback: get the first available department
          const { data: firstDept } = await supabaseAdmin
            .from('departments')
            .select('id')
            .limit(1)
            .single();
          deptId = firstDept?.id;
        }

        // Try to get default role (member)
        const { data: defaultRole } = await supabaseAdmin
          .from('roles')
          .select('id')
          .eq('slug', 'member')
          .single();

        if (defaultRole?.id) {
          roleId = defaultRole.id;
        } else {
          // Fallback: get the first available role
          const { data: firstRole } = await supabaseAdmin
            .from('roles')
            .select('id')
            .limit(1)
            .single();
          roleId = firstRole?.id;
        }

        console.log('Using dept_id:', deptId, 'role_id:', roleId);

        // Create user profile using service role (bypasses RLS)
        const profilePayload: any = {
          id: data.user.id,
          name: data.user.email?.split('@')[0] || 'User',
          email: data.user.email,
          status: 'active',
          joined_at: new Date().toISOString()
        };

        if (deptId) profilePayload.dept_id = deptId;
        if (roleId) profilePayload.role_id = roleId;

        const { data: newProfile, error: insertError } = await supabaseAdmin
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

      const [firstName, ...lastNameParts] = profileData.name.split(' ');
      const deptSlug = (profileData.department as any)?.slug || 'tech';
      const roleSlug = (profileData.role as any)?.slug || 'member';

      const user = {
        id: profileData.id,
        email: profileData.email,
        firstName: firstName,
        lastName: lastNameParts.join(' ') || '',
        department: deptSlug.replace(/_/g, '-'),
        role: roleSlug.replace(/_/g, '-'),
      };

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
    if (!supabase) {
      res.status(503).json({ error: 'Authentication service not configured' });
      return;
    }

    const { error } = await supabase.auth.signOut();

    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
