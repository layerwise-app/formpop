import { useState } from 'react';
import { Monitor, Play, Smartphone } from 'lucide-react';
import { Segmented } from '~/components/segmented';
import { Button } from '~/components/ui/button';
import { cn } from '~/lib/utils';
import { useEditor } from './editor-state';
import { LivePreview } from './live-preview';
import { QuestionList, type Selection } from './question-list';
import { QuestionSettings } from './question-settings';

type Pane = 'questions' | 'edit' | 'preview';

export function BuildPanel({ onPreview }: { onPreview: () => void }) {
  const { document } = useEditor();
  const [selected, setSelected] = useState<Selection>(document.fields[0]?.id ?? 'welcome');
  const [pane, setPane] = useState<Pane>('edit');
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop');

  // On small screens choosing an item jumps straight to its settings.
  function selectFromList(selection: Selection) {
    setSelected(selection);
    setPane('edit');
  }

  return (
    <div className='flex min-h-0 flex-1 flex-col'>
      <div className='border-b px-4 py-2 lg:hidden'>
        <Segmented
          label='Builder pane'
          value={pane}
          onChange={setPane}
          className='flex w-full'
          options={[
            { value: 'questions', label: 'Questions' },
            { value: 'edit', label: 'Edit' },
            { value: 'preview', label: 'Preview' }
          ]}
        />
      </div>
      <div className='grid min-h-0 flex-1 lg:grid-cols-[16rem_22rem_minmax(0,1fr)] xl:grid-cols-[17rem_24rem_minmax(0,1fr)]'>
        <aside
          className={cn(
            'min-h-0 overflow-hidden border-r bg-background lg:block',
            pane === 'questions' ? 'block' : 'hidden'
          )}
        >
          <QuestionList selected={selected} onSelect={selectFromList} />
        </aside>
        <section
          aria-label='Settings'
          className={cn(
            'min-h-0 overflow-y-auto border-r bg-background lg:block',
            pane === 'edit' ? 'block' : 'hidden'
          )}
        >
          <QuestionSettings selected={selected} onSelect={setSelected} />
        </section>
        <section
          aria-label='Preview'
          className={cn(
            'fp-dots min-h-0 flex-col bg-muted/50 p-4 lg:flex lg:p-6',
            pane === 'preview' ? 'flex' : 'hidden'
          )}
        >
          <div className='mb-3 flex items-center justify-between gap-2'>
            <Segmented
              label='Preview size'
              size='sm'
              value={device}
              onChange={setDevice}
              className='hidden sm:inline-flex'
              options={[
                { value: 'desktop', label: <Monitor />, ariaLabel: 'Desktop' },
                { value: 'mobile', label: <Smartphone />, ariaLabel: 'Mobile' }
              ]}
            />
            <Button size='sm' variant='outline' className='ml-auto bg-background' onClick={onPreview}>
              <Play />
              Try it
            </Button>
          </div>
          <div className='min-h-[30rem] flex-1'>
            <LivePreview
              document={document}
              selected={selected}
              onSelect={setSelected}
              narrow={device === 'mobile'}
            />
          </div>
        </section>
      </div>
    </div>
  );
}
