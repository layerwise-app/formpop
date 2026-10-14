import { useState } from 'react';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useMutation } from '@tanstack/react-query';
import { ChevronDown } from 'lucide-react';
import { AuthShell, FormMessage, textLink } from '~/components/auth-shell';
import { Button } from '~/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '~/components/ui/collapsible';
import { Field, FieldGroup, FieldLabel, FieldSeparator } from '~/components/ui/field';
import { Input } from '~/components/ui/input';
import { Spinner } from '~/components/ui/spinner';
import { authClient } from '~/lib/auth-client';
import { seo } from '~/utils/seo';

export const Route = createFileRoute('/sign-in')({
  head: () => ({ meta: seo({ title: 'Sign in · Formpop' }) }),
  component: SignInPage
});

function SignInPage() {
  const navigate = useNavigate();
  const [otpEmail, setOtpEmail] = useState('');
  const [passwordEmail, setPasswordEmail] = useState('');
  const [password, setPassword] = useState('');

  const sendOtp = useMutation({
    mutationFn: async () => {
      const { error } = await authClient.emailOtp.sendVerificationOtp({
        email: otpEmail,
        type: 'sign-in'
      });
      if (error) throw new Error(error.message ?? 'Could not send a code.');
    },
    onSuccess: () => navigate({ to: '/sign-in/otp', search: { email: otpEmail } })
  });

  const signInWithPassword = useMutation({
    mutationFn: async () => {
      const { error } = await authClient.signIn.email({ email: passwordEmail, password });
      if (error) throw new Error(error.message ?? 'Could not sign in.');
    },
    onSuccess: () => navigate({ to: '/dashboard' })
  });

  return (
    <AuthShell
      title='Sign in'
      description='We’ll email you a sign-in code.'
      footer={
        <>
          New to Formpop?{' '}
          <Link to='/sign-up' className={textLink}>
            Create an account
          </Link>
        </>
      }
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          sendOtp.mutate();
        }}
      >
        <FieldGroup className='gap-4'>
          <Field>
            <FieldLabel htmlFor='otp-email'>Email</FieldLabel>
            <Input
              id='otp-email'
              type='email'
              autoComplete='email'
              autoFocus
              required
              value={otpEmail}
              onChange={(event) => {
                setOtpEmail(event.target.value);
                sendOtp.reset();
              }}
            />
          </Field>
          <FormMessage error={sendOtp.error} />
          <Button type='submit' size='lg' disabled={sendOtp.isPending}>
            {sendOtp.isPending ? <Spinner /> : null}
            Email me a code
          </Button>
        </FieldGroup>
      </form>
      <FieldSeparator className='my-4 *:data-[slot=field-separator-content]:bg-card'>or</FieldSeparator>
      <Collapsible>
        <CollapsibleTrigger asChild>
          <Button variant='ghost' className='group w-full'>
            Use a password
            <ChevronDown className='transition-transform group-data-[state=open]:rotate-180' />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className='pt-4'>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              signInWithPassword.mutate();
            }}
          >
            <FieldGroup className='gap-4'>
              <Field>
                <FieldLabel htmlFor='password-email'>Email</FieldLabel>
                <Input
                  id='password-email'
                  type='email'
                  autoComplete='email'
                  required
                  value={passwordEmail}
                  onChange={(event) => {
                    setPasswordEmail(event.target.value);
                    signInWithPassword.reset();
                  }}
                />
              </Field>
              <Field>
                <div className='flex items-center justify-between gap-4'>
                  <FieldLabel htmlFor='password'>Password</FieldLabel>
                  <Link
                    to='/forgot-password'
                    className='rounded-sm text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline'
                  >
                    Forgot password?
                  </Link>
                </div>
                <Input
                  id='password'
                  type='password'
                  autoComplete='current-password'
                  required
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    signInWithPassword.reset();
                  }}
                />
              </Field>
              <FormMessage error={signInWithPassword.error} />
              <Button type='submit' variant='outline' size='lg' disabled={signInWithPassword.isPending}>
                {signInWithPassword.isPending ? <Spinner /> : null}
                Sign in
              </Button>
            </FieldGroup>
          </form>
        </CollapsibleContent>
      </Collapsible>
    </AuthShell>
  );
}
