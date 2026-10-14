import { useState } from 'react';
import { createFileRoute, Link, redirect, useNavigate } from '@tanstack/react-router';
import { useMutation } from '@tanstack/react-query';
import { AuthShell, FormMessage, textLink } from '~/components/auth-shell';
import { Button } from '~/components/ui/button';
import { FieldGroup } from '~/components/ui/field';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '~/components/ui/input-otp';
import { Spinner } from '~/components/ui/spinner';
import { authClient } from '~/lib/auth-client';
import { seo } from '~/utils/seo';

export const Route = createFileRoute('/sign-in_/otp')({
  validateSearch: (search: Record<string, unknown>) => ({
    email: typeof search.email === 'string' ? search.email.trim() : ''
  }),
  beforeLoad: ({ search }) => {
    if (!search.email) throw redirect({ to: '/sign-in' });
  },
  head: () => ({ meta: seo({ title: 'Check your email · Formpop' }) }),
  component: EmailOtpPage
});

function EmailOtpPage() {
  const navigate = useNavigate();
  const { email } = Route.useSearch();
  const [otp, setOtp] = useState('');

  const verifyOtp = useMutation({
    mutationFn: async () => {
      const { error } = await authClient.signIn.emailOtp({ email, otp });
      if (error) throw new Error(error.message ?? 'That code didn’t work.');
    },
    onSuccess: () => navigate({ to: '/dashboard' })
  });

  const resendOtp = useMutation({
    mutationFn: async () => {
      const { error } = await authClient.emailOtp.sendVerificationOtp({
        email,
        type: 'sign-in'
      });
      if (error) throw new Error(error.message ?? 'Could not resend the code.');
    }
  });

  return (
    <AuthShell
      title='Check your email'
      description={
        <>
          Enter the 6-digit code sent to <span className='text-foreground'>{email}</span>.
        </>
      }
      footer={
        <Link to='/sign-in' className={textLink}>
          Use a different email
        </Link>
      }
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          verifyOtp.mutate();
        }}
      >
        <FieldGroup className='gap-4'>
          <InputOTP
            autoFocus
            autoComplete='one-time-code'
            aria-label='Sign-in code'
            containerClassName='w-full'
            maxLength={6}
            value={otp}
            onChange={(value) => {
              setOtp(value);
              verifyOtp.reset();
            }}
          >
            <InputOTPGroup className='w-full'>
              {Array.from({ length: 6 }, (_, index) => (
                <InputOTPSlot key={index} index={index} className='h-12 flex-1 text-lg' />
              ))}
            </InputOTPGroup>
          </InputOTP>
          <FormMessage error={verifyOtp.error ?? resendOtp.error} />
          <Button type='submit' size='lg' disabled={otp.length < 6 || verifyOtp.isPending}>
            {verifyOtp.isPending ? <Spinner /> : null}
            Sign in
          </Button>
          <Button
            type='button'
            variant='ghost'
            disabled={resendOtp.isPending}
            onClick={() => resendOtp.mutate()}
          >
            {resendOtp.isPending ? <Spinner /> : null}
            {resendOtp.isSuccess ? 'Code sent again' : 'Resend code'}
          </Button>
        </FieldGroup>
      </form>
    </AuthShell>
  );
}
