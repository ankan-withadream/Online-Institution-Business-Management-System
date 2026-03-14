import { supabaseAdmin, supabase } from '../config/supabase.js';

export const register = async (req, res) => {
  try {
    const { email, password, fullName, role } = req.body;

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError) {
      return res.status(400).json({ error: authError.message });
    }

    // Get role ID
    const { data: roleData } = await supabaseAdmin
      .from('roles')
      .select('id')
      .eq('name', role)
      .single();

    if (!roleData) {
      return res.status(400).json({ error: `Role '${role}' not found` });
    }

    // Create user record in our users table
    const { error: dbError } = await supabaseAdmin.from('users').insert({
      id: authData.user.id,
      email,
      full_name: fullName,
      role_id: roleData.id,
    });

    if (dbError) {
      // Cleanup: remove the auth user if DB insert fails
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return res.status(500).json({ error: 'Failed to create user record' });
    }

    res.status(201).json({ message: 'User registered successfully', userId: authData.user.id });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Fetch user with role
    const { data: user, error: dbErr } = await supabaseAdmin
      .from('users')
      .select('id, email, full_name, role_id, is_active, roles(name)')
      .eq('id', data.user.id)
      .single();
      
    console.log('DB USER FETCHED IN LOGIN:', user, 'ERROR:', dbErr);

    if (!user?.is_active) {
      return res.status(403).json({ error: 'Account is deactivated' });
    }

    res.json({
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.roles?.name,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const { error } = await supabaseAdmin.auth.resetPasswordForEmail(email);
    if (error) {
      return res.status(400).json({ error: error.message });
    }
    res.json({ message: 'Password reset email sent' });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ error: 'Failed to send reset email' });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { password } = req.body;
    const token = req.headers.authorization?.split(' ')[1];

    const { error } = await supabaseAdmin.auth.admin.updateUserById(
      (await supabaseAdmin.auth.getUser(token)).data.user.id,
      { password }
    );

    if (error) {
      return res.status(400).json({ error: error.message });
    }
    res.json({ message: 'Password reset successfully' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ error: 'Password reset failed' });
  }
};

export const getMe = async (req, res) => {
  res.json({ user: req.user });
};

export const logout = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    await supabaseAdmin.auth.admin.signOut(token);
    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    res.json({ message: 'Logged out' });
  }
};
