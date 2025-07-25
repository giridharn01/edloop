import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAppContext } from '@/hooks/useAppContext';
import { Loader2 } from 'lucide-react';

interface RegisterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSwitchToLogin?: () => void;
}

const RegisterDialog = ({ open, onOpenChange, onSwitchToLogin }: RegisterDialogProps) => {
  const { register, isLoading } = useAppContext();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    displayName: '',
    university: ''
  });
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.username || !formData.email || !formData.password || !formData.displayName) {
      setError('Please fill in all required fields');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    try {
      await register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        displayName: formData.displayName,
        university: formData.university || undefined
      });
      onOpenChange(false);
      setFormData({
        username: '',
        email: '',
        password: '',
        displayName: '',
        university: ''
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    }
  };

  const handleInputChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
    if (error) setError(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Join EdLoop</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="reg-username">Username *</Label>
            <Input
              id="reg-username"
              type="text"
              value={formData.username}
              onChange={handleInputChange('username')}
              placeholder="Choose a username"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reg-email">Email *</Label>
            <Input
              id="reg-email"
              type="email"
              value={formData.email}
              onChange={handleInputChange('email')}
              placeholder="your.email@university.edu"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reg-display-name">Display Name *</Label>
            <Input
              id="reg-display-name"
              type="text"
              value={formData.displayName}
              onChange={handleInputChange('displayName')}
              placeholder="Your full name"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reg-university">University</Label>
            <Input
              id="reg-university"
              type="text"
              value={formData.university}
              onChange={handleInputChange('university')}
              placeholder="e.g., Harvard, MIT, Stanford"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reg-password">Password *</Label>
            <Input
              id="reg-password"
              type="password"
              value={formData.password}
              onChange={handleInputChange('password')}
              placeholder="At least 6 characters"
              disabled={isLoading}
            />
          </div>

          <div className="flex flex-col gap-3">
            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Account
            </Button>

            {onSwitchToLogin && (
              <Button
                type="button"
                variant="ghost"
                onClick={onSwitchToLogin}
                disabled={isLoading}
                className="w-full"
              >
                Already have an account? Sign In
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default RegisterDialog;
