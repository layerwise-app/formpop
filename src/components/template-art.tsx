import { ArrowUpRight, CalendarDays, Heart, MessageCircle, Sparkles, Users } from 'lucide-react';

export function TemplateArt({ type, color }: { type: string; color: string }) {
  return <div className={`template-art art-${color}`} aria-hidden='true'>
    <span className='art-dot dot-one' /><span className='art-dot dot-two' /><span className='art-orbit' />
    {type === 'message' ? <><div className='art-bubble bubble-one'><span className='bubble-face'>:)</span><span className='bubble-lines'><i /><i /></span><Heart size={16} /></div><div className='art-bubble bubble-two'><span>Good things to say.</span><Sparkles size={16} /></div><span className='art-spark'>✳</span></> :
      type === 'wave' ? <><span className='art-hello'>hello<span>!</span></span><div className='art-sticker'><ArrowUpRight size={31} /></div><span className='hello-underline' /></> :
      type === 'calendar' ? <><div className='art-calendar'><div><i /><i /></div><span>LET'S GET TOGETHER</span><strong>24</strong><small>Save your spot <ArrowUpRight size={12} /></small></div><span className='art-calendar-star'>✳</span></> :
      type === 'users' ? <><div className='art-person person-one'><span /><i /></div><div className='art-person person-two'><span /><i /></div><div className='art-person person-three'><span /><i /></div><span className='art-person-label'>Every person. A new perspective.</span></> :
      type === 'spark' ? <><span className='art-team'>Great things.<br />Good people.</span><div className='art-team-sticker'><Sparkles size={32} /></div><span className='art-team-arrow'>↗</span></> :
      <><div className='art-pulse-card'><span>How's it going?</span><div><Heart size={21} /><Heart size={21} /><Heart size={21} /></div><small>A little check-in goes a long way.</small></div><span className='art-pulse-spark'>✳</span></>}
  </div>;
}

export function TemplateIcon({ icon, size = 17 }: { icon: string; size?: number }) {
  const Icon = icon === 'message' ? MessageCircle : icon === 'calendar' ? CalendarDays : icon === 'users' ? Users : icon === 'heart' ? Heart : icon === 'wave' ? ArrowUpRight : Sparkles;
  return <Icon size={size} />;
}
