import { useState } from 'react';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useMutation } from '@tanstack/react-query';
import { AuthShell, FormMessage, textLink } from '~/components/auth-shell';
import { Button } from '~/components/ui/button';
import { Field, FieldDescription, FieldGroup, FieldLabel } from '~/components/ui/field';
import { Input } from '~/components/ui/input';
import { Spinner } from '~/components/ui/spinner';
import { authClient } from '~/lib/auth-client';
import { templateInfo, type TemplateId } from '~/lib/form-templates';
import { seo } from '~/utils/seo';

export const Route = createFileRoute('/sign-up')({
  // A template picked on the landing page carries through to the dashboard.
  validateSearch: (search: Record<string, unknown>): { template?: TemplateId } => ({
    template: templateInfo.find((t) => t.id === search.template)?.id
  }),
  head: () => ({ meta: seo({ title: 'Create account · Formpop' }) }),
  component: SignUpPage
});

function SignUpPage() {
  const navigate = useNavigate();
  const { template } = Route.useSearch();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const mismatch = Boolean(confirmPassword) && password !== confirmPassword;

  const signUp = useMutation({
    mutationFn: async () => {
      const { error } = await authClient.signUp.email({ name, email, password });
      if (error) throw new Error(error.message ?? 'Could not create your account.');
    },
    onSuccess: () => navigate({ to: '/dashboard', search: { template } })
  });

  return (
    <AuthShell
      title='Create your account'
      footer={
        <>
          Already have an account?{' '}
          <Link to='/sign-in' className={textLink}>
            Sign in
          </Link>
        </>
      }
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (password === confirmPassword) signUp.mutate();
        }}
      >
        <FieldGroup className='gap-4'>
          <Field>
            <FieldLabel htmlFor='name'>Name</FieldLabel>
            <Input
              id='name'
              autoComplete='name'
              autoFocus
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor='email'>Email</FieldLabel>
            <Input
              id='email'
              type='email'
              autoComplete='email'
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor='password'>Password</FieldLabel>
            <Input
              id='password'
              type='password'
              autoComplete='new-password'
              minLength={8}
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <FieldDescription>At least 8 characters.</FieldDescription>
          </Field>
          <Field data-invalid={mismatch || undefined}>
            <FieldLabel htmlFor='confirm-password'>Confirm password</FieldLabel>
            <Input
              id='confirm-password'
              type='password'
              autoComplete='new-password'
              minLength={8}
              required
              aria-invalid={mismatch || undefined}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
            />
            {mismatch ? (
              <p className='text-sm text-destructive'>Passwords don’t match.</p>
            ) : null}
          </Field>
          <FormMessage error={signUp.error} />
          <Button type='submit' size='lg' disabled={mismatch || signUp.isPending}>
            {signUp.isPending ? <Spinner /> : null}
            Create account
          </Button>
        </FieldGroup>
      </form>
    </AuthShell>
  );
}
