import type { CSSProperties, ReactNode } from 'react';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { ArrowRight } from 'lucide-react';
import {
  AnalyticsFragment,
  EditorFragment,
  LogicFragment
} from '~/components/landing/feature-fragments';
import { HeroMockup } from '~/components/landing/hero-mockup';
import { LandingFooter, LandingNav } from '~/components/landing/landing-chrome';
import { Button } from '~/components/ui/button';
import { TemplateGallery } from '~/components/workspace/template-gallery';
import { useReveal } from '~/hooks/use-reveal';
import { getAuthSession } from '~/lib/auth.functions';
import { cn } from '~/lib/utils';
import { seo } from '~/utils/seo';

export const Route = createFileRoute('/')({
  loader: async () => ({ signedIn: Boolean(await getAuthSession()) }),
  head: () => ({
    meta: seo({
      title: 'Formpop · Forms people finish',
      description:
        'Build conversational forms that ask one question at a time, with logic, themes and analytics built in.'
    })
  }),
  component: Home
});

const features: { title: string; body: string; fragment: ReactNode }[] = [
  {
    title: 'Build it in minutes.',
    body: 'Ten question types and a live preview that updates as you type.',
    fragment: <EditorFragment />
  },
  {
    title: 'Ask only what matters.',
    body: 'Show a question only when an earlier answer calls for it.',
    fragment: <LogicFragment />
  },
  {
    title: 'See where people drop off.',
    body: 'Views, starts and completions by day, plus a summary of every question.',
    fragment: <AnalyticsFragment />
  }
];

const delay = (ms: number) => ({ '--d': ms }) as CSSProperties;

function Home() {
  const { signedIn } = Route.useLoaderData();
  const navigate = useNavigate();
  const ref = useReveal<HTMLDivElement>();
  const start = signedIn ? '/dashboard' : '/sign-up';

  return (
    <div ref={ref} className='min-h-dvh overflow-x-clip bg-background'>
      <LandingNav signedIn={signedIn} />
      <main>
        <section className='mx-auto grid max-w-6xl items-center gap-14 px-4 pt-10 pb-20 sm:px-6 sm:pt-16 lg:grid-cols-[1fr_1.1fr] lg:gap-16 lg:pt-20 lg:pb-24'>
          <div>
            <h1 className='fp-rise font-display text-[clamp(2.75rem,7.4vw,4.75rem)] leading-[1.02] text-balance'>
              Forms people actually <em className='text-primary'>finish.</em>
            </h1>
            <p className='fp-rise mt-5 max-w-md text-lg text-muted-foreground sm:text-xl' style={delay(120)}>
              One question at a time, with logic, themes and analytics built in.
            </p>
            <div className='fp-rise mt-8 flex flex-wrap gap-3' style={delay(240)}>
              <Button size='lg' asChild>
                <Link to={start}>
                  {signedIn ? 'Open dashboard' : 'Get started'}
                  <ArrowRight className='transition-transform group-hover/button:translate-x-0.5' />
                </Link>
              </Button>
              <Button size='lg' variant='outline' asChild>
                <Link to='/demo'>Try a template</Link>
              </Button>
            </div>
          </div>
          <div className='fp-rise' style={delay(380)}>
            <HeroMockup />
          </div>
        </section>

        <div className='mx-auto flex max-w-6xl flex-col gap-24 px-4 py-12 sm:px-6 lg:gap-36'>
          {features.map((feature, i) => (
            <section
              key={feature.title}
              className='grid items-center gap-8 lg:grid-cols-[0.8fr_1fr] lg:gap-20'
            >
              <div data-reveal className={cn('max-w-md', i % 2 === 1 && 'lg:order-2')}>
                <h2 className='font-display text-4xl leading-tight text-balance sm:text-5xl'>
                  {feature.title}
                </h2>
                <p className='mt-4 text-lg text-muted-foreground'>{feature.body}</p>
              </div>
              <div
                data-reveal
                style={{ '--i': 1 } as CSSProperties}
                className='fp-dots rounded-[2rem] bg-accent p-4 sm:p-10'
              >
                {feature.fragment}
              </div>
            </section>
          ))}
        </div>

        <section className='mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-28'>
          <div data-reveal className='mb-10 max-w-xl'>
            <h2 className='font-display text-4xl leading-tight sm:text-5xl'>Start from a template.</h2>
            <p className='mt-4 text-lg text-muted-foreground'>Open one to answer it yourself.</p>
          </div>
          <TemplateGallery
            rowOnPhone
            onUse={(template) =>
              void navigate({ to: signedIn ? '/dashboard' : '/sign-up', search: { template } })
            }
          />
        </section>

        <section className='mx-auto max-w-6xl px-4 pb-20 sm:px-6 lg:pb-28'>
          <div
            data-reveal
            className='flex flex-col items-center rounded-[2rem] bg-foreground px-6 py-16 text-center text-background sm:py-24'
          >
            <h2 className='max-w-2xl font-display text-4xl leading-tight text-balance sm:text-5xl'>
              Your next form is one question away.
            </h2>
            <Button size='lg' asChild className='mt-8'>
              <Link to={start}>
                {signedIn ? 'Open dashboard' : 'Get started'}
                <ArrowRight className='transition-transform group-hover/button:translate-x-0.5' />
              </Link>
            </Button>
          </div>
        </section>
      </main>
      <LandingFooter />
    </div>
  );
}
