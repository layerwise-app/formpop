import { Link } from '@tanstack/react-router';

export function PopMark({ className = '' }: { className?: string }) {
  return <svg className={className} width='31' height='31' viewBox='0 0 40 40' fill='none' aria-hidden='true'>
    <path d='M17 2h6l1.5 9 7.4-5.2 4.3 4.3-5.2 7.4 9 1.5v6l-9 1.5 5.2 7.4-4.3 4.3-7.4-5.2-1.5 9h-6l-1.5-9-7.4 5.2-4.3-4.3 5.2-7.4L0 25v-6l9-1.5-5.2-7.4 4.3-4.3 7.4 5.2L17 2Z' fill='currentColor' transform='translate(2 -1) scale(.9)'/>
    <circle cx='20' cy='19' r='4' fill='var(--pop-paper, #fff)'/>
  </svg>;
}

export function Brand({ small = false, to = '/' }: { small?: boolean; to?: '/' | '/dashboard' }) {
  return <Link to={to} className={`pop-brand ${small ? 'small' : ''}`} aria-label={to === '/dashboard' ? 'Formpop dashboard' : 'Formpop home'}><PopMark /><span>formpop<span className='brand-dot'>.</span></span></Link>;
}
