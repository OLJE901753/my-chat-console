import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { SecureForm, SecureInput } from '@/components/SecureForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { authService } from '@/lib/auth';

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  const handleLogin = async (formData: FormData) => {
    try {
      setIsLoading(true);
      
      const email = formData.get('email') as string;
      const password = formData.get('password') as string;
      
      if (!email || !password) {
        throw new Error('Email and password are required');
      }
      
      await authService.login({ email, password });
      
      toast({
        title: 'Success',
        description: 'Login successful! Redirecting to dashboard...',
      });
      
      // Redirect to intended destination or dashboard after successful login
      const from = new URLSearchParams(location.search).get('from') || '/dashboard';
      setTimeout(() => navigate(from), 1000);
      
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-6">
      {/* Farm Access Box - Centered */}
      <div className="w-full max-w-md">
        <Card className="glass-card border-lime-500/30">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl gradient-text font-bold">Farm Access</CardTitle>
            <CardDescription className="text-gray-300">
              Sign in to access the farm management dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SecureForm onSubmit={handleLogin} submitText="Sign In" loading={isLoading}>
              <SecureInput
                label="Email"
                name="email"
                type="email"
                placeholder="Enter your email"
                required
                validation={(value) => {
                  if (!value) return 'Email is required';
                  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Invalid email format';
                  return null;
                }}
              />
              <SecureInput
                label="Password"
                name="password"
                type="password"
                placeholder="Enter your password"
                required
                validation={(value) => {
                  if (!value) return 'Password is required';
                  if (value.length < 8) return 'Password must be at least 8 characters';
                  return null;
                }}
              />
            </SecureForm>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;
