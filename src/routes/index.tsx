import { createFileRoute, Link } from '@tanstack/react-router';
import { ArrowRight, ArrowUpRight, Check, CornerDownLeft, Heart, ListChecks, MessageCircle, Palette, Sparkles } from 'lucide-react';
import { Brand, PopMark } from '~/components/formpop-brand';
import { TemplateArt } from '~/components/template-art';
import { Button } from '~/components/ui/button';
import { getAuthSession } from '~/lib/auth.functions';
import { templateInfo } from '~/lib/form-model';
import { seo } from '~/utils/seo';

export const Route = createFileRoute('/')({
  loader: () => getAuthSession(),
  head: () => ({ meta: seo({ title: 'Formpop · Good conversations start here', description: 'A thoughtful form builder. Create, share, and listen, one question at a time.' }) }),
  component: Home,
});
function Home() {
  const session = Route.useLoaderData();
  const start = session ? '/dashboard' : '/sign-up';

  return <div className='landing-page'>
    <header className='landing-header'>
      <Brand />
      <nav aria-label='Main navigation'>
        <a href='#features'>Why Formpop</a>
        <a href='#how-it-works'>How it works</a>
        <Link to='/demo'>Explore the demo <ArrowUpRight size={13} /></Link>
      </nav>
      <div className='landing-header-actions'>
        {!session && <Link to='/sign-in' className='landing-sign-in'>Sign in</Link>}
        <Button asChild className='pop-primary'><Link to={start}>{session ? 'My dashboard' : 'Get started'}<ArrowRight size={15} /></Link></Button>
      </div>
    </header>

    <main>
      <section className='landing-hero'>
        <div className='landing-hero-copy'>
          <span className='landing-kicker'><Sparkles size={13} /> LESS FORMAL. MORE HUMAN.</span>
          <h1>Not just a form.<br />A good <span>conversation.</span></h1>
          <p>A little curiosity goes a long way. Create thoughtful forms that ask one question at a time, and make it easier for people to open up.</p>
          <div className='landing-hero-actions'>
            <Button asChild className='pop-primary'><Link to={start}>{session ? 'Go to your dashboard' : 'Create your first form'}<ArrowRight size={17} /></Link></Button>
            <Link to='/demo' className='landing-demo-link'>Take a little look <ArrowUpRight size={16} /></Link>
          </div>
          <span className='landing-reassurance'><Check size={13} /> Your questions. Your style. Your corner of the internet.</span>
        </div>

        <div className='landing-hero-art'>
          <span className='landing-art-orbit' aria-hidden='true' />
          <span className='landing-art-star' aria-hidden='true'><PopMark /></span>
          <div className='landing-form-preview'>
            <div className='landing-preview-top'><span><PopMark />A little about you</span><span>02 / 05</span></div>
            <div className='landing-preview-progress'><span /></div>
            <div className='landing-preview-question'>
              <span className='landing-question-index'>02 <ArrowRight size={14} /> NICE TO MEET YOU</span>
              <h2>What makes<br />your day a little better?</h2>
              <p>It's the little things, isn't it?</p>
              <div className='landing-preview-choices'>
                <Link to='/demo'><kbd>A</kbd>A fresh idea <Sparkles size={16} /></Link>
                <Link to='/demo' className='chosen'><kbd>B</kbd>A good conversation <Check size={17} /></Link>
                <Link to='/demo'><kbd>C</kbd>A small act of kindness <Heart size={16} /></Link>
              </div>
              <Link to='/demo' className='landing-preview-next'>Let's keep talking <ArrowRight size={15} /></Link>
              <span className='landing-preview-enter'>One question at a time. <CornerDownLeft size={11} /></span>
            </div>
            <div className='landing-preview-bottom'>Made with <PopMark /><strong>formpop.</strong></div>
          </div>
          <div className='landing-art-note'><MessageCircle size={20} /><span>More than answers.<br /><strong>A little connection.</strong></span><Heart size={17} /></div>
        </div>
      </section>

      <div className='landing-use-cases'><span>FOR ALL THE THINGS YOU WANT TO KNOW</span><div><span>Customer feedback</span><i /><span>New connections</span><i /><span>Event sign-ups</span><i /><span>Bright ideas</span></div></div>

      <section className='landing-features' id='features'>
        <div className='landing-section-heading'><span className='eyebrow'>SMALL DETAILS. A BIG DIFFERENCE.</span><h2>Good questions deserve<br />a better way to ask.</h2><p>Everything you need to start listening. Nothing to get in the way.</p></div>
        <div className='landing-feature-grid'>
          {[
            { icon: MessageCircle, title: 'A conversation, not a checklist.', text: 'One focused question at a time. Keyboard-friendly navigation keeps the conversation flowing.' },
            { icon: Palette, title: 'A little more you.', text: 'Your colors, your words, your welcome. Make every screen feel like a natural extension of your brand.' },
            { icon: ListChecks, title: 'Thoughtful from start to finish.', text: 'Ask the right follow-up with conditional questions. Collect real responses and take them with you as CSV.' },
          ].map(({ icon: Icon, title, text }) => <article key={title}><span className='landing-feature-icon'><Icon size={24} /></span><h3>{title}</h3><p>{text}</p></article>)}
        </div>
      </section>

      <section className='landing-how' id='how-it-works'>
        <div className='landing-section-heading'><span className='eyebrow'>FROM A LITTLE IDEA TO A REAL CONNECTION</span><h2>Make it. Share it. Listen.</h2></div>
        <div className='landing-steps'>
          {[
            ['01', 'Start with a little curiosity.', 'Pick a template or a fresh canvas. Add your questions and drag them into the right order.'],
            ['02', 'Give it your own personality.', 'Choose your colors, add a warm welcome, and preview the whole conversation.'],
            ['03', 'Let the answers come to you.', 'Publish, share your link, and explore the responses in your private dashboard.'],
          ].map(([number, title, text]) => <article key={number}><span>{number}</span><h3>{title}</h3><p>{text}</p></article>)}
        </div>
      </section>

      <section className='landing-templates'>
        <div className='landing-section-heading'><div><span className='eyebrow'>A HEAD START ON SOMETHING GOOD</span><h2>Your first form is already half an idea.</h2><p>Original templates for real-life moments. Ready for your little twist.</p></div><Link to='/demo'>Explore all templates <ArrowUpRight size={16} /></Link></div>
        <div className='landing-template-grid'>{templateInfo.slice(0, 3).map((template) => <Link to='/demo' className='landing-template-card' key={template.id}><TemplateArt type={template.icon} color={template.color} /><div><span>{template.category}</span><h3>{template.title}<ArrowUpRight size={16} /></h3><p>{template.description}</p></div></Link>)}</div>
      </section>

      <section className='landing-final-cta'><PopMark /><span className='eyebrow'>THE FIRST QUESTION IS YOURS</span><h2>What will your next<br />conversation be about?</h2><p>Big ideas. Small beginnings. A little more human.</p><Button asChild className='pop-primary'><Link to={start}>{session ? 'Open your dashboard' : 'Make something worth answering'}<ArrowRight size={17} /></Link></Button><Link to='/demo'>Or explore the demo first <ArrowUpRight size={13} /></Link></section>
    </main>

    <footer className='landing-footer'><Brand small /><span>Small forms. Real connections.</span><div><Link to='/demo'>Try the demo</Link><Link to={session ? '/dashboard' : '/sign-in'}>{session ? 'Your dashboard' : 'Sign in'}</Link></div></footer>
  </div>;
}
