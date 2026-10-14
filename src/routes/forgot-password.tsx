import { useState } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { useMutation } from '@tanstack/react-query';
import { AuthShell, FormMessage, textLink } from '~/components/auth-shell';
import { Button } from '~/components/ui/button';
import { Field, FieldGroup, FieldLabel } from '~/components/ui/field';
import { Input } from '~/components/ui/input';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '~/components/ui/input-otp';
import { Spinner } from '~/components/ui/spinner';
import { authClient } from '~/lib/auth-client';
import { seo } from '~/utils/seo';

export const Route = createFileRoute('/forgot-password')({
  head: () => ({ meta: seo({ title: 'Reset password · Formpop' }) }),
  component: ForgotPasswordPage
});

const backToSignIn = (
  <Link to='/sign-in' className={textLink}>
    Back to sign in
  </Link>
);

function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const mismatch = Boolean(confirmPassword) && password !== confirmPassword;

  const requestReset = useMutation({
    mutationFn: async () => {
      const { error } = await authClient.emailOtp.requestPasswordReset({ email });
      if (error) throw new Error(error.message ?? 'Could not send a reset code.');
    }
  });

  const resetPassword = useMutation({
    mutationFn: async () => {
      const { error } = await authClient.emailOtp.resetPassword({ email, otp, password });
      if (error) throw new Error(error.message ?? 'Could not reset your password.');
    }
  });

  if (resetPassword.isSuccess) {
    return (
      <AuthShell title='Password updated' description='Sign in with your new password.'>
        <Button asChild size='lg' className='w-full'>
          <Link to='/sign-in'>Sign in</Link>
        </Button>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title='Reset password'
      description='We’ll email you a 6-digit code.'
      footer={backToSignIn}
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          setOtp('');
          resetPassword.reset();
          requestReset.mutate();
        }}
      >
        <FieldGroup className='gap-4'>
          <Field>
            <FieldLabel htmlFor='email'>Email</FieldLabel>
            <Input
              id='email'
              type='email'
              autoComplete='email'
              autoFocus
              required
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setOtp('');
                requestReset.reset();
                resetPassword.reset();
              }}
            />
          </Field>
          <FormMessage error={requestReset.error} />
          <Button
            type='submit'
            size='lg'
            variant={requestReset.isSuccess ? 'outline' : 'default'}
            disabled={requestReset.isPending}
          >
            {requestReset.isPending ? <Spinner /> : null}
            {requestReset.isSuccess ? 'Send a new code' : 'Send code'}
          </Button>
        </FieldGroup>
      </form>
      {requestReset.isSuccess ? (
        <form
          className='fp-rise mt-6 border-t pt-6'
          onSubmit={(event) => {
            event.preventDefault();
            if (password === confirmPassword) resetPassword.mutate();
          }}
        >
          <FieldGroup className='gap-4'>
            <Field>
              <FieldLabel>Code</FieldLabel>
              <InputOTP
                autoFocus
                aria-label='Reset code'
                containerClassName='w-full'
                maxLength={6}
                value={otp}
                onChange={(value) => {
                  setOtp(value);
                  resetPassword.reset();
                }}
              >
                <InputOTPGroup className='w-full'>
                  {Array.from({ length: 6 }, (_, index) => (
                    <InputOTPSlot key={index} index={index} className='h-11 flex-1' />
                  ))}
                </InputOTPGroup>
              </InputOTP>
            </Field>
            <Field>
              <FieldLabel htmlFor='password'>New password</FieldLabel>
              <Input
                id='password'
                type='password'
                autoComplete='new-password'
                minLength={8}
                required
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  resetPassword.reset();
                }}
              />
            </Field>
            <Field data-invalid={mismatch || undefined}>
              <FieldLabel htmlFor='confirm-password'>Confirm new password</FieldLabel>
              <Input
                id='confirm-password'
                type='password'
                autoComplete='new-password'
                minLength={8}
                required
                aria-invalid={mismatch || undefined}
                value={confirmPassword}
                onChange={(event) => {
                  setConfirmPassword(event.target.value);
                  resetPassword.reset();
                }}
              />
              {mismatch ? (
                <p className='text-sm text-destructive'>Passwords don’t match.</p>
              ) : null}
            </Field>
            <FormMessage error={resetPassword.error} />
            <Button
              type='submit'
              size='lg'
              disabled={otp.length < 6 || mismatch || resetPassword.isPending}
            >
              {resetPassword.isPending ? <Spinner /> : null}
              Reset password
            </Button>
          </FieldGroup>
        </form>
      ) : null}
    </AuthShell>
  );
}
