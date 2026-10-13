import type { ReactNode } from 'react';
import { ArrowLeft, MessageCircle, Sparkles } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { Brand, PopMark } from '~/components/formpop-brand';

export function AuthShell({ children }: { children: ReactNode }) {
  return <div className='auth-shell'>
    <aside className='auth-story'><Brand /><div className='auth-story-content'><span className='eyebrow'>A LITTLE MORE HUMAN</span><h1>Behind every answer,<br />there's a person.</h1><p>Give your questions a little personality.<br />Make space for meaningful conversations.</p><div className='auth-illustration' aria-hidden='true'><span className='auth-orbit' /><div className='auth-note'><PopMark /><strong>So, what's<br />your story?</strong><span>We'd love to hear it.</span></div><div className='auth-bubble'><MessageCircle size={22} /><span>Good things start here.</span><Sparkles size={18} /></div><span className='auth-art-star'>✳</span></div></div><footer>Small forms. Real connections.</footer></aside>
    <main className='auth-main'><Link to='/' className='auth-back'><ArrowLeft size={15} />Back to Formpop</Link><div className='auth-mobile-brand'><Brand /></div>{children}<span className='auth-bottom-note'>Your forms. Your people. Your little corner of the internet.</span></main>
  </div>;
}
