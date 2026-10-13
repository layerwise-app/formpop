import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react';
import { ArrowDown, ArrowRight, ArrowUp, Check, CheckCheck, CornerDownLeft } from 'lucide-react';
import { Button } from '~/components/ui/button';
import { PopMark } from '~/components/formpop-brand';
import { answerError, validateAnswers, visibleFields, type Answer, type Answers, type FormDocument } from '~/lib/form-model';

type Props = { document: FormDocument; preview?: boolean; onSubmit?: (answers: Answers) => Promise<void>; compact?: boolean };

export function ConversationalForm({ document, preview = false, onSubmit, compact = false }: Props) {
  const [step, setStep] = useState(document.welcome.enabled ? -1 : 0);
  const [answers, setAnswers] = useState<Answers>({});
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const [finished, setFinished] = useState(false);
  const container = useRef<HTMLDivElement>(null);
  const visible = visibleFields(document.fields, answers);
  const current = visible[Math.min(step, visible.length - 1)];
  const welcome = step === -1;
  const last = step >= visible.length - 1;
  const progress = finished ? 100 : welcome ? 0 : Math.round((step / Math.max(1, visible.length)) * 100);
  const theme = { '--form-bg': document.theme.background, '--form-text': document.theme.text, '--form-accent': document.theme.accent } as CSSProperties;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const target = container.current?.querySelector<HTMLElement>('[data-answer], [data-next]');
      target?.focus();
    }, 60);
    return () => window.clearTimeout(timer);
  }, [step, finished]);

  function answer(value: Answer) {
    if (current) setAnswers((previous) => ({ ...previous, [current.id]: value }));
    setError('');
  }
  async function next() {
    if (pending || finished) return;
    if (welcome) { setStep(0); return; }
    if (current) {
      const issue = answerError(current, answers[current.id]);
      if (issue) { setError(issue); return; }
    }
    if (!last) { setStep((s) => s + 1); setError(''); return; }
    setPending(true);
    try {
      const cleaned = validateAnswers(document, answers);
      await onSubmit?.(cleaned);
      setFinished(true);
      setError('');
    } catch (e) { setError(e instanceof Error ? e.message : 'Your response could not be saved. Please try again.'); }
    finally { setPending(false); }
  }
  function back() { if (!pending && step > 0) { setStep(step - 1); setError(''); } }
  function keyboard(event: KeyboardEvent<HTMLDivElement>) {
    if (event.defaultPrevented || pending || finished) return;
    const target = event.target as HTMLElement;
    if (event.key === 'Enter' && target.closest('.form-choice') && current) {
      event.preventDefault();
      const choice = target.closest<HTMLButtonElement>('.form-choice');
      if (choice && choice.getAttribute('aria-pressed') !== 'true') {
        const option = current.options[Array.from(container.current?.querySelectorAll('.form-choice') ?? []).indexOf(choice)];
        if (option) choose(option);
      } else { void next(); }
      return;
    }
    if (event.key === 'Enter' && (target.tagName === 'BUTTON' || (target.tagName === 'TEXTAREA' && !event.ctrlKey && !event.metaKey))) return;
    if (event.key === 'Enter') { event.preventDefault(); void next(); }
    const editing = ['INPUT', 'TEXTAREA'].includes(target.tagName);
    if (!editing && event.key === 'ArrowUp') { event.preventDefault(); back(); }
    if (!editing && event.key === 'ArrowDown') { event.preventDefault(); void next(); }
    if (!editing && current?.type.includes('choice') && /^[a-zA-Z]$/.test(event.key)) {
      const index = event.key.toUpperCase().charCodeAt(0) - 65;
      if (current.options[index]) {
        event.preventDefault();
        choose(current.options[index]);
        container.current?.querySelectorAll<HTMLButtonElement>('.form-choice')[index]?.focus();
      }
    }
  }
  function choose(option: string) {
    if (!current) return;
    if (current.type === 'single_choice') answer(option);
    else {
      const selected = Array.isArray(answers[current.id]) ? answers[current.id] as string[] : [];
      answer(selected.includes(option) ? selected.filter((o) => o !== option) : [...selected, option]);
    }
  }
  return <div ref={container} className={`conversation ${compact ? 'compact' : ''}`} style={theme} onKeyDown={keyboard}>
    <div className='conversation-top'><div className='conversation-logo'><PopMark />{document.title}</div>{preview && <span className='preview-pill'>Draft preview · responses are not saved</span>}</div>
    <div className='form-progress' role='progressbar' aria-label='Form progress' aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}><span style={{ width: `${progress}%` }} /></div>
    <main className='conversation-main'>
      {finished ? <div className='conversation-content form-reveal' key='thanks'>
        <div className='form-symbol'><CheckCheck size={32} /></div><h1>{document.thankYou.title}</h1><p>{document.thankYou.description}</p>
        {preview && <Button data-next className='form-next' onClick={() => { setFinished(false); setAnswers({}); setStep(document.welcome.enabled ? -1 : 0); }}>Preview again <ArrowRight /></Button>}
        {!preview && <span className='submission-confirmation'><Check size={15} /> Response successfully saved</span>}
      </div> : welcome ? <div className='conversation-content form-reveal' key='welcome'>
        <div className='form-symbol'><PopMark /></div><span className='form-eyebrow'>A LITTLE CONVERSATION, A BIG DIFFERENCE</span>
        <h1>{document.welcome.title}</h1><p>{document.welcome.description}</p>
        <div className='form-next-row'><Button data-next className='form-next' onClick={() => void next()}>{document.welcome.button}<ArrowRight /></Button><span>press <strong>Enter</strong> <CornerDownLeft size={13} /></span></div>
        <div className='form-time'>{document.fields.length} questions · about {Math.max(1, Math.ceil(document.fields.length / 3))} min</div>
      </div> : current ? <div className='conversation-content form-reveal' key={current.id}>
        <div className='question-number'>{step + 1} <ArrowRight size={16} /><span>{current.required ? 'Required' : 'Optional'}</span></div>
        <h1 id='question-label'>{current.label}{current.required && <span className='required-star'>*</span>}</h1>
        {current.description && <p id='question-description'>{current.description}</p>}
        <div className='answer-area'>
          {current.type.includes('choice') ? <div className='choice-list' role='group' aria-labelledby='question-label'>
            {current.type === 'multiple_choice' && <span className='choice-hint'>Choose as many as you like.</span>}
            {current.options.map((option, i) => {
              const selected = Array.isArray(answers[current.id]) ? answers[current.id].includes(option) : answers[current.id] === option;
              return <button data-answer={i === 0 ? '' : undefined} key={option} type='button' className={`form-choice ${selected ? 'selected' : ''}`} aria-pressed={selected} onClick={() => choose(option)}><kbd>{String.fromCharCode(65 + i)}</kbd><span>{option}</span>{selected && <Check size={18} />}</button>;
            })}
          </div> : current.type === 'long_text' ? <><textarea data-answer aria-labelledby='question-label' aria-describedby={error ? 'answer-error' : 'question-description'} aria-invalid={!!error} placeholder='Take your time. We are listening...' value={answers[current.id] as string ?? ''} onChange={(e) => answer(e.target.value)} maxLength={10000} rows={4} /><span className='choice-hint'>New line with Enter. Continue with Ctrl + Enter.</span></> : <input key={current.id} data-answer aria-labelledby='question-label' aria-describedby={error ? 'answer-error' : 'question-description'} aria-invalid={!!error} type={current.type === 'short_text' ? 'text' : current.type} placeholder={current.type === 'email' ? 'you@example.com' : current.type === 'number' ? 'Enter a number...' : 'Type your answer here...'} value={answers[current.id] as string ?? ''} onChange={(e) => answer(e.target.value)} maxLength={1000} />}
        </div>
        {error && <p className='form-error' role='alert' id='answer-error'>{error}</p>}
        <div className='form-next-row'><Button data-next className='form-next' disabled={pending} onClick={() => void next()}>{pending ? 'Saving response...' : last ? preview ? 'Finish preview' : 'Submit response' : 'Continue'}{!pending && (last ? <Check /> : <ArrowRight />)}</Button><span>press <strong>Enter</strong> <CornerDownLeft size={13} /></span></div>
      </div> : <div className='conversation-content'><h1>Nothing to answer just yet.</h1><Button onClick={() => void next()}>Finish</Button></div>}
    </main>
    <footer className='conversation-footer'><span>Made with <PopMark /><strong>formpop.</strong></span>{!welcome && !finished && <div><span>{Math.min(step + 1, visible.length)} of {visible.length}</span><button aria-label='Previous question' disabled={step <= 0 || pending} onClick={back}><ArrowUp size={18} /></button><button aria-label='Next question' disabled={pending} onClick={() => void next()}><ArrowDown size={18} /></button></div>}{finished && <span>Good conversations start here.</span>}</footer>
  </div>;
}
