import { useState } from 'react';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { Button } from '~/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '~/components/ui/dialog';
import { TemplateGallery } from '~/components/workspace/template-gallery';
import { WorkspaceHeader } from '~/components/workspace/workspace-header';
import { getAuthSession } from '~/lib/auth.functions';
import { seo } from '~/utils/seo';

export const Route = createFileRoute('/demo')({
  loader: async () => ({ user: (await getAuthSession())?.user ?? null }),
  head: () => ({
    meta: seo({
      title: 'Templates · Formpop',
      description: 'Try every Formpop template as a respondent. No account needed.'
    })
  }),
  component: Demo
});

function Demo() {
  const { user } = Route.useLoaderData();
  const navigate = useNavigate();
  const [askAuth, setAskAuth] = useState(false);

  return (
    <div className='min-h-dvh bg-background'>
      <WorkspaceHeader user={user ?? undefined} />
      <main className='mx-auto flex max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6 sm:py-12'>
        <div className='max-w-xl'>
          <h1 className='font-display text-3xl sm:text-4xl'>Templates</h1>
          <p className='mt-2 text-muted-foreground'>
            Open one to answer it like a respondent. Nothing you type is saved.
          </p>
        </div>
        <TemplateGallery
          onUse={(template) =>
            user
              ? void navigate({ to: '/dashboard', search: { template } })
              : setAskAuth(true)
          }
        />
      </main>
      <Dialog open={askAuth} onOpenChange={setAskAuth}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create an account to use templates</DialogTitle>
            <DialogDescription>
              Your forms and responses stay private to your account.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant='outline' asChild>
              <Link to='/sign-in'>Sign in</Link>
            </Button>
            <Button asChild>
              <Link to='/sign-up'>Create account</Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
