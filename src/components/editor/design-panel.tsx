import { useState } from 'react';
import { AlertTriangle, Check } from 'lucide-react';
import { Segmented } from '~/components/segmented';
import { Field, FieldGroup, FieldLabel } from '~/components/ui/field';
import { Input } from '~/components/ui/input';
import { themePresets } from '~/lib/form-templates';
import { contrastRatio, type FormTheme } from '~/lib/form-model';
import { cn } from '~/lib/utils';
import { useEditor } from './editor-state';
import { LivePreview } from './live-preview';

const colorFields: { key: keyof FormTheme; label: string }[] = [
  { key: 'background', label: 'Background' },
  { key: 'text', label: 'Text' },
  { key: 'accent', label: 'Accent' }
];

const sameTheme = (a: FormTheme, b: FormTheme) =>
  a.background === b.background && a.text === b.text && a.accent === b.accent;

function ColorField({
  label,
  value,
  onChange
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  // Keep partial hex input local until it is a complete color.
  const [draft, setDraft] = useState<string | null>(null);
  const id = `color-${label.toLowerCase()}`;
  return (
    <Field orientation='horizontal' className='items-center'>
      <FieldLabel htmlFor={id} className='flex-1 font-normal'>
        {label}
      </FieldLabel>
      <div className='flex items-center gap-2'>
        <label className='relative size-8 shrink-0 cursor-pointer overflow-hidden rounded-full ring-1 ring-border transition-shadow focus-within:ring-2 focus-within:ring-ring'>
          <span className='absolute inset-0' style={{ background: value }} />
          <input
            type='color'
            aria-label={`${label} color picker`}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className='absolute inset-0 cursor-pointer opacity-0'
          />
        </label>
        <Input
          id={id}
          value={draft ?? value}
          maxLength={7}
          spellCheck={false}
          className='w-24 font-mono text-xs uppercase'
          onChange={(e) => {
            const next = e.target.value.startsWith('#') ? e.target.value : `#${e.target.value}`;
            setDraft(next);
            if (/^#[0-9a-fA-F]{6}$/.test(next)) onChange(next.toLowerCase());
          }}
          onBlur={() => setDraft(null)}
        />
      </div>
    </Field>
  );
}

export function DesignPanel() {
  const { document, setDocument, locked } = useEditor();
  const [screen, setScreen] = useState<'welcome' | 'question' | 'thanks'>('question');
  const theme = document.theme;
  const setTheme = (patch: Partial<FormTheme>) =>
    setDocument((d) => ({ ...d, theme: { ...d.theme, ...patch } }));
  const textContrast = contrastRatio(theme.text, theme.background);
  const accentContrast = contrastRatio(theme.accent, theme.background);
  const selected =
    screen === 'question' ? (document.fields[0]?.id ?? 'welcome') : screen;

  return (
    <div className='grid flex-1 lg:min-h-0 lg:grid-cols-[22rem_minmax(0,1fr)] xl:grid-cols-[24rem_minmax(0,1fr)]'>
      <fieldset disabled={locked} className='min-w-0 border-b bg-background p-4 lg:overflow-y-auto lg:border-r lg:border-b-0'>
        <FieldGroup className='gap-6'>
          <section>
            <h2 className='mb-3 text-sm font-semibold'>Theme</h2>
            <div className='grid grid-cols-3 gap-2'>
              {themePresets.map((preset) => {
                const active = sameTheme(preset.theme, theme);
                return (
                  <button
                    key={preset.id}
                    type='button'
                    aria-pressed={active}
                    onClick={() => setTheme(preset.theme)}
                    className={cn(
                      'group/preset rounded-xl border p-1.5 text-left outline-none transition-[border-color,box-shadow,transform] hover:-translate-y-0.5 hover:shadow-sm focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50',
                      active ? 'border-primary ring-1 ring-primary' : 'border-border'
                    )}
                  >
                    <span
                      className='relative flex h-14 flex-col justify-between rounded-lg p-2'
                      style={{ background: preset.theme.background }}
                    >
                      <span className='font-display text-sm leading-none' style={{ color: preset.theme.text }}>
                        Aa
                      </span>
                      <span className='h-2 w-8 rounded-full' style={{ background: preset.theme.accent }} />
                      {active ? (
                        <Check className='absolute top-1.5 right-1.5 size-3.5' style={{ color: preset.theme.accent }} />
                      ) : null}
                    </span>
                    <span className='mt-1 block px-0.5 text-xs font-medium'>{preset.name}</span>
                  </button>
                );
              })}
            </div>
          </section>
          <section className='flex flex-col gap-3'>
            <h2 className='text-sm font-semibold'>Colors</h2>
            {colorFields.map(({ key, label }) => (
              <ColorField
                key={key}
                label={label}
                value={theme[key]}
                onChange={(value) => setTheme({ [key]: value })}
              />
            ))}
            {textContrast < 4.5 || accentContrast < 2 ? (
              <p className='flex gap-2 rounded-lg bg-[#fff4e5] p-3 text-sm text-[#8a4b00]'>
                <AlertTriangle className='mt-0.5 size-4 shrink-0' />
                {textContrast < 4.5
                  ? `Text contrast is ${textContrast.toFixed(1)}:1. Aim for at least 4.5:1 so everyone can read your questions.`
                  : 'The accent is hard to tell apart from the background.'}
              </p>
            ) : null}
          </section>
        </FieldGroup>
      </fieldset>
      <section aria-label='Preview' className='fp-dots flex min-h-[34rem] flex-col bg-muted/50 p-4 lg:p-6'>
        <Segmented
          label='Preview screen'
          size='sm'
          value={screen}
          onChange={setScreen}
          className='mb-3 self-start'
          options={[
            { value: 'welcome', label: 'Welcome' },
            { value: 'question', label: 'Question' },
            { value: 'thanks', label: 'Thank you' }
          ]}
        />
        <div className='flex-1'>
          <LivePreview document={document} selected={selected} />
        </div>
      </section>
    </div>
  );
}
