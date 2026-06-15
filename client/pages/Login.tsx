import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/auth/authContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertCircle, Loader2 } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const { login, isLoading } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    try {
      await login(email, password);
      navigate('/auth/department-redirect');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header - App Name */}
      <div className="p-6 border-b border-border">
        <h1 className="text-2xl font-bold text-primary">JCF</h1>
        <p className="text-xs opacity-80 mt-1">Central Hub</p>
      </div>

      {/* Login Content */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-sm">
          {/* Login Card */}
          <div className="rounded-xl shadow-lg p-8 bg-card border border-border">
            <h2 className="text-2xl font-bold mb-2 text-foreground">Sign In</h2>
            <p className="text-sm mb-8 text-muted-foreground">
              Welcome back to JCF Central Hub
            </p>

            {error && (
              <div className="mb-6 p-3 rounded-lg flex items-start gap-3 bg-destructive/10 border border-destructive">
                <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0 text-destructive" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium mb-2 text-foreground"
                >
                  Email Address
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  className="w-full"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium mb-2 text-foreground"
                >
                  Password
                </label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="w-full"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="remember"
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                    disabled={isLoading}
                  />
                  <label
                    htmlFor="remember"
                    className="text-sm cursor-pointer text-muted-foreground"
                  >
                    Remember me
                  </label>
                </div>
                <a
                  href="#"
                  className="text-sm hover:underline font-medium text-primary"
                >
                  Forgot password?
                </a>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full font-medium py-2.5 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 hover:opacity-90 bg-primary text-primary-foreground"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-border">
              <p className="text-xs text-muted-foreground">
                Use your registered email and password to sign in. If you don't have an account, please contact your administrator.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-border p-6 text-center">
        <p className="text-xs text-muted-foreground">
          © 2024 Jarurat Care Foundation. All rights reserved.
        </p>
      </div>
    </div>
  );
}
