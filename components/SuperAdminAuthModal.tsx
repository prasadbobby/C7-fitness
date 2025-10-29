"use client";

import { useState, useEffect } from "react";
import {
  Button,
  Input,
  Select,
  SelectItem,
  Card,
  CardBody,
  CardHeader,
  Spinner,
} from "@nextui-org/react";
import {
  IconLock,
  IconMail,
  IconEye,
  IconEyeOff,
  IconShield,
  IconKey,
} from "@tabler/icons-react";
import BottomSheet from "@/components/UI/BottomSheet";

interface SuperAdminAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type AuthStep = 'select_admin' | 'check_first_time' | 'set_password' | 'login' | 'forgot_password' | 'verify_otp' | 'reset_password';

interface SuperAdmin {
  email: string;
}

export default function SuperAdminAuthModal({ isOpen, onClose, onSuccess }: SuperAdminAuthModalProps) {
  const [step, setStep] = useState<AuthStep>('select_admin');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form data
  const [superAdmins, setSuperAdmins] = useState<SuperAdmin[]>([]);
  const [selectedEmail, setSelectedEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isFirstTime, setIsFirstTime] = useState(false);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      fetchSuperAdmins();
      resetForm();
    }
  }, [isOpen]);

  const resetForm = () => {
    setStep('select_admin');
    setSelectedEmail('');
    setPassword('');
    setConfirmPassword('');
    setOtp('');
    setError('');
    setSuccess('');
    setIsFirstTime(false);
  };

  const fetchSuperAdmins = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/super-admin-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_super_admins' }),
      });

      if (response.ok) {
        const data = await response.json();
        setSuperAdmins(data.emails.map((email: string) => ({ email })));
      } else {
        setError('Failed to load super admin list');
      }
    } catch (err) {
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSelect = async (email: string) => {
    setSelectedEmail(email);
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/admin/super-admin-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'check_first_time', email }),
      });

      if (response.ok) {
        const data = await response.json();
        setIsFirstTime(data.isFirstTime);
        setStep(data.isFirstTime ? 'set_password' : 'login');
      } else {
        setError('Failed to check account status');
      }
    } catch (err) {
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const handleSetPassword = async () => {
    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/admin/super-admin-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'set_password',
          email: selectedEmail,
          password,
        }),
      });

      if (response.ok) {
        setSuccess('Password set successfully! You are now logged in.');
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1500);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to set password');
      }
    } catch (err) {
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!password) {
      setError('Please enter your password');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/admin/super-admin-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'login',
          email: selectedEmail,
          password,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess('Login successful!');
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1000);
      } else {
        setError(data.error || 'Invalid password');
      }
    } catch (err) {
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/admin/super-admin-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'forgot_password',
          email: selectedEmail,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess('OTP sent to your email! Please check your inbox.');
        setStep('verify_otp');
      } else {
        setError(data.error || 'Failed to send OTP');
      }
    } catch (err) {
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      setError('Please enter the 6-digit OTP');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/admin/super-admin-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'verify_otp',
          email: selectedEmail,
          otp,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess('OTP verified! Please set your new password.');
        setStep('reset_password');
      } else {
        setError(data.error || 'Invalid OTP');
      }
    } catch (err) {
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/admin/super-admin-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reset_password',
          email: selectedEmail,
          password,
          otp,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess('Password reset successfully! You are now logged in.');
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1500);
      } else {
        setError(data.error || 'Failed to reset password');
      }
    } catch (err) {
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const getStepTitle = () => {
    switch (step) {
      case 'select_admin':
        return 'Select Super Admin';
      case 'set_password':
        return 'Set Your Password';
      case 'login':
        return 'Enter Password';
      case 'forgot_password':
        return 'Forgot Password';
      case 'verify_otp':
        return 'Verify OTP';
      case 'reset_password':
        return 'Reset Password';
      default:
        return 'Authentication';
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case 'select_admin':
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <IconShield size={48} className="mx-auto text-primary mb-3" />
              <p className="text-foreground-600">
                Select your email from the super admin list to continue
              </p>
            </div>

            <Select
              placeholder="Select super admin email"
              selectedKeys={selectedEmail ? [selectedEmail] : []}
              onChange={(e) => handleEmailSelect(e.target.value)}
              disabled={loading}
              startContent={<IconMail size={18} />}
            >
              {superAdmins.map((admin) => (
                <SelectItem key={admin.email} value={admin.email}>
                  {admin.email}
                </SelectItem>
              ))}
            </Select>
          </div>
        );

      case 'set_password':
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <IconKey size={48} className="mx-auto text-success mb-3" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Welcome!</h3>
              <p className="text-foreground-600">
                This is your first time accessing the payment info page.
                Please set a secure password to continue.
              </p>
            </div>

            <Input
              type={showPassword ? "text" : "password"}
              placeholder="Enter new password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              startContent={<IconLock size={18} />}
              endContent={
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-foreground-400 hover:text-foreground-600"
                >
                  {showPassword ? <IconEyeOff size={18} /> : <IconEye size={18} />}
                </button>
              }
              disabled={loading}
            />

            <Input
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              startContent={<IconLock size={18} />}
              endContent={
                <button
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="text-foreground-400 hover:text-foreground-600"
                >
                  {showConfirmPassword ? <IconEyeOff size={18} /> : <IconEye size={18} />}
                </button>
              }
              disabled={loading}
            />

            <div className="text-xs text-foreground-500 mt-2">
              Password must be at least 8 characters long
            </div>
          </div>
        );

      case 'login':
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <IconLock size={48} className="mx-auto text-primary mb-3" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Enter Password</h3>
              <p className="text-foreground-600 text-sm">
                Email: <span className="font-medium">{selectedEmail}</span>
              </p>
            </div>

            <Input
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              startContent={<IconLock size={18} />}
              endContent={
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-foreground-400 hover:text-foreground-600"
                >
                  {showPassword ? <IconEyeOff size={18} /> : <IconEye size={18} />}
                </button>
              }
              disabled={loading}
              onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
            />

            <div className="text-center">
              <Button
                color="primary"
                variant="light"
                size="sm"
                onPress={() => setStep('forgot_password')}
                disabled={loading}
              >
                Forgot Password?
              </Button>
            </div>
          </div>
        );

      case 'verify_otp':
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <IconMail size={48} className="mx-auto text-warning mb-3" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Check Your Email</h3>
              <p className="text-foreground-600 text-sm">
                We've sent a 6-digit OTP to <span className="font-medium">{selectedEmail}</span>
              </p>
            </div>

            <Input
              type="text"
              placeholder="Enter 6-digit OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              maxLength={6}
              className="text-center text-2xl tracking-widest"
              disabled={loading}
              onKeyPress={(e) => e.key === 'Enter' && otp.length === 6 && handleVerifyOTP()}
            />

            <div className="text-center">
              <Button
                color="primary"
                variant="light"
                size="sm"
                onPress={handleForgotPassword}
                disabled={loading}
              >
                Resend OTP
              </Button>
            </div>
          </div>
        );

      case 'reset_password':
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <IconKey size={48} className="mx-auto text-success mb-3" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Reset Password</h3>
              <p className="text-foreground-600">
                Enter your new password below
              </p>
            </div>

            <Input
              type={showPassword ? "text" : "password"}
              placeholder="Enter new password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              startContent={<IconLock size={18} />}
              endContent={
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-foreground-400 hover:text-foreground-600"
                >
                  {showPassword ? <IconEyeOff size={18} /> : <IconEye size={18} />}
                </button>
              }
              disabled={loading}
            />

            <Input
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              startContent={<IconLock size={18} />}
              endContent={
                <button
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="text-foreground-400 hover:text-foreground-600"
                >
                  {showConfirmPassword ? <IconEyeOff size={18} /> : <IconEye size={18} />}
                </button>
              }
              disabled={loading}
            />
          </div>
        );

      default:
        return null;
    }
  };

  const renderActionButtons = () => {
    const commonButtonProps = {
      disabled: loading,
      className: "w-full",
    };

    switch (step) {
      case 'select_admin':
        return (
          <div className="flex gap-3">
            <Button color="default" variant="light" onPress={onClose} {...commonButtonProps}>
              Cancel
            </Button>
          </div>
        );

      case 'set_password':
        return (
          <div className="flex gap-3">
            <Button color="default" variant="light" onPress={() => setStep('select_admin')} {...commonButtonProps}>
              Back
            </Button>
            <Button color="primary" onPress={handleSetPassword} {...commonButtonProps}>
              {loading ? <Spinner size="sm" color="white" /> : 'Set Password'}
            </Button>
          </div>
        );

      case 'login':
        return (
          <div className="flex gap-3">
            <Button color="default" variant="light" onPress={() => setStep('select_admin')} {...commonButtonProps}>
              Back
            </Button>
            <Button color="primary" onPress={handleLogin} {...commonButtonProps}>
              {loading ? <Spinner size="sm" color="white" /> : 'Login'}
            </Button>
          </div>
        );

      case 'forgot_password':
        return (
          <div className="flex gap-3">
            <Button color="default" variant="light" onPress={() => setStep('login')} {...commonButtonProps}>
              Back
            </Button>
            <Button color="warning" onPress={handleForgotPassword} {...commonButtonProps}>
              {loading ? <Spinner size="sm" color="white" /> : 'Send OTP'}
            </Button>
          </div>
        );

      case 'verify_otp':
        return (
          <div className="flex gap-3">
            <Button color="default" variant="light" onPress={() => setStep('login')} {...commonButtonProps}>
              Back
            </Button>
            <Button
              color="primary"
              onPress={handleVerifyOTP}
              disabled={loading || otp.length !== 6}
              {...commonButtonProps}
            >
              {loading ? <Spinner size="sm" color="white" /> : 'Verify OTP'}
            </Button>
          </div>
        );

      case 'reset_password':
        return (
          <div className="flex gap-3">
            <Button color="default" variant="light" onPress={() => setStep('verify_otp')} {...commonButtonProps}>
              Back
            </Button>
            <Button color="success" onPress={handleResetPassword} {...commonButtonProps}>
              {loading ? <Spinner size="sm" color="white" /> : 'Reset Password'}
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={getStepTitle()}
      size="lg"
      footer={renderActionButtons()}
    >
      <div className="space-y-6">
        {error && (
          <div className="p-3 rounded-lg bg-danger-50 border border-danger-200 text-danger-600 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="p-3 rounded-lg bg-success-50 border border-success-200 text-success-600 text-sm">
            {success}
          </div>
        )}

        {loading && step === 'select_admin' ? (
          <div className="flex justify-center py-8">
            <Spinner size="lg" />
          </div>
        ) : (
          renderStepContent()
        )}
      </div>
    </BottomSheet>
  );
}