import { useEffect, useState, type CSSProperties } from 'react';
import { useBlocker, useNavigate } from '@tanstack/react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, ArrowUpRight, CalendarDays, Check, Copy, Download, Eye, FileText, GripVertical, Hash, ListChecks, Mail, MessageCircle, Palette, Plus, Rocket, Save, Settings2, Sparkles, TextCursorInput, Trash2, Type, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Textarea } from '~/components/ui/textarea';
import { Label } from '~/components/ui/label';
import { Switch } from '~/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '~/components/ui/dialog';
import { Brand, PopMark } from '~/components/formpop-brand';
import { ConversationalForm } from '~/components/conversational-form';
import { exportResponses, getForm, getResponses, publishForm, saveForm } from '~/lib/forms.functions';
import { fieldTypes, newField, typeLabels, type FormDocument, type FormField, type FieldType, validateDocument } from '~/lib/form-model';

const fieldIcons = { short_text: Type, long_text: TextCursorInput, email: Mail, number: Hash, single_choice: ListChecks, multiple_choice: ListChecks, date: CalendarDays };
function SortableQuestion({ field, index, selected, disabled, onSelect }: { field: FormField; index: number; selected: boolean; disabled: boolean; onSelect: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: field.id, disabled });
  const Icon = fieldIcons[field.type];
  return <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? .45 : 1 }} className={`editor-question-item ${selected ? 'selected' : ''}`}>
    <button className='drag-handle' disabled={disabled} {...attributes} {...listeners} aria-label={`Drag question ${index + 1}: ${field.label}`}><GripVertical size={14} /></button>
    <button className='question-select' onClick={onSelect}><span className='question-type-icon'><Icon size={14} /></span><span><small>{String(index + 1).padStart(2, '0')}</small>{field.label}</span>{field.required && <span className='question-required'>*</span>}</button>
  </div>;
}

type SavedForm = Awaited<ReturnType<typeof getForm>>;
export function FormpopEditor({ initial, initialTab }: { initial: SavedForm; initialTab: 'build' | 'design' | 'responses' }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [saved, setSaved] = useState(initial);
  const [document, setDocument] = useState<FormDocument>(initial.draft);
  const [selectedId, setSelectedId] = useState<string>('welcome');
  const [tab, setTab] = useState(initialTab);
  const [addOpen, setAddOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [mobilePanel, setMobilePanel] = useState<'questions' | 'settings' | null>(null);
  const [responseId, setResponseId] = useState<string | null>(null);
  const dirty = JSON.stringify(document) !== JSON.stringify(saved.draft);
  const field = document.fields.find((f) => f.id === selectedId);
  const selectedIndex = document.fields.findIndex((f) => f.id === selectedId);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
  const responses = useQuery({ queryKey: ['responses', initial.id], queryFn: () => getResponses({ data: initial.id }), enabled: tab === 'responses' });
  const response = responses.data?.find((r) => r.id === responseId);
  useEffect(() => setTab(initialTab), [initialTab]);
  useBlocker({
    shouldBlockFn: ({ current, next }) => dirty && current.pathname !== next.pathname && !window.confirm('You have unsaved draft changes. Leave without saving?'),
    enableBeforeUnload: dirty,
  });
  const save = useMutation({
    mutationFn: async () => {
      const updated = await saveForm({ data: { id: saved.id, revision: saved.revision, document } });
      setSaved(updated);
      setDocument(updated.draft);
      void queryClient.invalidateQueries({ queryKey: ['forms'] });
      return updated;
    },
    onSuccess: () => toast.success('Draft saved. Your live form is unchanged.'),
    onError: (e) => toast.error(e.message),
  });
  const publish = useMutation({
    mutationFn: async () => {
      let current = saved;
      if (dirty) current = await saveForm({ data: { id: saved.id, revision: saved.revision, document } });
      setSaved(current);
      setDocument(current.draft);
      const result = await publishForm({ data: saved.id });
      setSaved({ ...current, activePublicationId: result.publicationId, status: 'published', publishedRevision: current.revision });
      return result;
    },
    onSuccess: () => { setShareOpen(true); void queryClient.invalidateQueries({ queryKey: ['forms'] }); toast.success('Your conversation is live.'); },
    onError: (e) => toast.error(e.message),
  });
  const exporting = useMutation({
    mutationFn: () => exportResponses({ data: saved.id }),
    onSuccess: ({ csv, filename }) => {
      const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
      const link = window.document.createElement('a'); link.href = url; link.download = filename; link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast.success('Your responses have been exported.');
    },
    onError: (e) => toast.error(e.message),
  });
  const busy = save.isPending || publish.isPending;
  const archived = saved.status === 'archived';
  function updateField(update: Partial<FormField>) { setDocument((d) => ({ ...d, fields: d.fields.map((f) => f.id === selectedId ? { ...f, ...update } : f) })); }
  function add(type: FieldType) {
    const question = newField(type); setDocument((d) => ({ ...d, fields: [...d.fields, question] })); setSelectedId(question.id); setAddOpen(false);
  }
  function reorder(from: number, to: number) {
    if (archived || busy) return;
    if (from < 0 || to < 0 || to >= document.fields.length) return;
    const fields = arrayMove(document.fields, from, to);
    const seen = new Set<string>();
    if (fields.some((f) => { const invalid = !!f.condition && !seen.has(f.condition.fieldId); seen.add(f.id); return invalid; })) { toast.error('Move visibility-dependent questions after the question they depend on.'); return; }
    setDocument((d) => ({ ...d, fields }));
  }
  function dragEnd(event: DragEndEvent) { if (event.over && event.active.id !== event.over.id) reorder(document.fields.findIndex((f) => f.id === event.active.id), document.fields.findIndex((f) => f.id === event.over!.id)); }
  function removeField() {
    if (!field || document.fields.length <= 1) return;
    setDocument((d) => ({ ...d, fields: d.fields.filter((f) => f.id !== field.id).map((f) => f.condition?.fieldId === field.id ? { ...f, condition: null } : f) }));
    setSelectedId('welcome');
  }
  function duplicateField() {
    if (!field) return;
    const copy = { ...field, id: crypto.randomUUID(), label: `${field.label.slice(0, 190)} (copy)` };
    setDocument((d) => ({ ...d, fields: [...d.fields.slice(0, selectedIndex + 1), copy, ...d.fields.slice(selectedIndex + 1)] })); setSelectedId(copy.id);
  }
  function preview() { try { validateDocument(document); setPreviewOpen(true); } catch (e) { toast.error(e instanceof Error ? e.message : 'Check your form settings.'); } }
  function leave() { void navigate({ to: '/dashboard' }); }
  const themeStyle = { background: document.theme.background, color: document.theme.text, '--form-accent': document.theme.accent } as CSSProperties;
  const shareUrl = typeof window === 'undefined' ? `/f/${saved.slug}` : `${window.location.origin}/f/${saved.slug}`;

  return <div className='editor-shell'>
    <header className='editor-header'><div className='editor-heading'><button className='icon-button' aria-label='Back to workspace' onClick={leave}><ArrowLeft size={20} /></button><Brand small to='/dashboard' /><span className='editor-divider' /><input aria-label='Form name' value={document.title} maxLength={200} disabled={archived || busy} onChange={(e) => setDocument((d) => ({ ...d, title: e.target.value }))} /><span className={`status-pill status-${saved.status}`}><span />{saved.status}</span></div><div className='editor-header-actions'><span className='save-indicator'>{dirty ? 'Unsaved changes' : <><Check size={13} /> All changes saved</>}</span><Button variant='outline' disabled={busy || !dirty || archived} onClick={() => save.mutate()}><Save />{save.isPending ? 'Saving...' : 'Save draft'}</Button><Button variant='outline' onClick={preview}><Eye />Preview</Button><Button className='pop-primary' disabled={busy || archived} onClick={() => publish.mutate()}><Rocket />{publish.isPending ? 'Publishing...' : saved.status === 'published' ? 'Publish changes' : 'Publish'}</Button></div></header>
    <nav className='editor-tabs' aria-label='Editor sections'><div>{[['build', 'Build', FileText], ['design', 'Design', Palette], ['responses', 'Responses', MessageCircle]].map(([id, label, icon]) => { const Icon = icon as typeof FileText; return <button key={id as string} className={tab === id ? 'active' : ''} onClick={() => { setTab(id as typeof tab); void navigate({ to: '/dashboard/forms/$formId', params: { formId: saved.id }, search: { tab: id as typeof tab }, replace: true }); }}><Icon size={16} />{label as string}</button>; })}</div><span>{saved.status === 'published' ? saved.revision !== saved.publishedRevision || dirty ? 'Draft changes are not live until you publish.' : 'Your published form is up to date.' : archived ? 'Archived · restore from your workspace to edit.' : 'Just between us until you publish.'}{saved.status === 'published' && <button onClick={() => setShareOpen(true)}>Share form <ArrowUpRight size={14} /></button>}</span></nav>
    {tab === 'responses' ? <main className='responses-page'><div className='responses-heading'><div><span className='eyebrow'>THE OTHER SIDE OF THE CONVERSATION</span><h1>Your responses<span>{responses.data?.length ?? 0}</span></h1><p>Real people. Thoughtful answers. All in one place.</p></div><div><Button variant='outline' onClick={() => void responses.refetch()}>Refresh</Button><Button className='pop-primary' disabled={exporting.isPending || !responses.data?.length} onClick={() => exporting.mutate()}><Download />{exporting.isPending ? 'Exporting...' : 'Export CSV'}</Button></div></div>{responses.isPending ? <div className='workspace-empty'><span className='loading-dot' /><p>Gathering your responses...</p></div> : responses.isError ? <div className='workspace-empty'><h3>We couldn't load your responses.</h3><p>{responses.error.message}</p><Button onClick={() => void responses.refetch()}>Try again</Button></div> : !responses.data?.length ? <div className='workspace-empty response-empty'><div className='empty-symbol'><MessageCircle size={30} /></div><h3>The conversation is just getting started.</h3><p>{saved.status === 'published' ? 'Share your link. New responses will appear here.' : 'Publish your form and share its link to collect your first response.'}</p>{saved.status === 'published' && <Button className='pop-primary' onClick={() => setShareOpen(true)}>Share your form <ArrowUpRight /></Button>}</div> : <div className='response-table-wrap'><table className='response-table'><thead><tr><th>Response</th><th>Submitted</th><th>Answers</th><th /></tr></thead><tbody>{responses.data.map((r, i) => <tr key={r.id} onClick={() => setResponseId(r.id)}><td><span className='response-avatar'>{responses.data.length - i}</span><strong>{Object.values(r.answers).find((a) => typeof a === 'string' && a.length > 0) as string || 'Anonymous response'}</strong></td><td>{new Date(r.createdAt).toLocaleString()}</td><td>{Object.keys(r.answers).length} answers</td><td><button aria-label={`View response ${r.id}`} className='text-action'>View details <ArrowUpRight size={14} /></button></td></tr>)}</tbody></table></div>}</main> : <>
      <div className='editor-mobile-controls'><button onClick={() => setMobilePanel(mobilePanel === 'questions' ? null : 'questions')}><ListChecks size={16} />Questions</button><span>{tab === 'design' ? 'Design your conversation' : field ? `Question ${selectedIndex + 1}` : selectedId === 'welcome' ? 'Welcome screen' : 'Thank-you screen'}</span><button onClick={() => setMobilePanel(mobilePanel === 'settings' ? null : 'settings')}><Settings2 size={16} />Settings</button></div>
      <div className='editor-layout'>
        <aside className={`editor-questions ${mobilePanel === 'questions' ? 'mobile-open' : ''}`}><div className='editor-panel-title'><strong>Your conversation</strong><span>{document.fields.length} questions</span></div><button className={`screen-list-item ${selectedId === 'welcome' ? 'selected' : ''}`} onClick={() => { setSelectedId('welcome'); setMobilePanel(null); }}><Sparkles size={16} /><span>Welcome screen</span><span className='screen-mini-tag'>{document.welcome.enabled ? 'On' : 'Off'}</span></button><div className='questions-section-label'>QUESTIONS <span>Drag to reorder</span></div><DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={dragEnd}><SortableContext items={document.fields.map((f) => f.id)} strategy={verticalListSortingStrategy}>{document.fields.map((f, index) => <SortableQuestion key={f.id} field={f} index={index} selected={selectedId === f.id} disabled={archived || busy} onSelect={() => { setSelectedId(f.id); setMobilePanel(null); }} />)}</SortableContext></DndContext><Button variant='outline' className='add-question-button' disabled={archived || document.fields.length >= 50 || busy} onClick={() => setAddOpen(true)}><Plus />Add question</Button><div className='question-panel-divider' /><button className={`screen-list-item ${selectedId === 'thanks' ? 'selected' : ''}`} onClick={() => { setSelectedId('thanks'); setMobilePanel(null); }}><Check size={16} /><span>Thank-you screen</span></button><div className='question-panel-tip'><Sparkles size={17} /><p>Keep it simple. A few thoughtful questions go a long way.</p></div></aside>
        <main className='editor-canvas'><div className='canvas-topbar'><span>LIVE DRAFT CANVAS</span><span><span className='live-dot' />{tab === 'design' ? 'Changes apply to every screen' : 'Click a question to edit'}</span></div><div className='canvas-page' style={themeStyle}><div className='canvas-logo'><PopMark /><span>{document.title}</span></div><div className='canvas-content' key={selectedId}>
          {selectedId === 'welcome' ? <><div className='canvas-welcome-symbol'><PopMark /></div><span className='form-eyebrow'>A LITTLE CONVERSATION, A BIG DIFFERENCE</span><h1>{document.welcome.title}</h1><p>{document.welcome.description}</p><button className='canvas-next' onClick={preview}>{document.welcome.button}<ArrowRight size={18} /></button><small>{document.fields.length} questions · about {Math.max(1, Math.ceil(document.fields.length / 3))} min</small>{!document.welcome.enabled && <span className='canvas-disabled-notice'>Welcome screen is disabled in the published form.</span>}</> : selectedId === 'thanks' ? <><div className='canvas-welcome-symbol'><Check size={30} /></div><h1>{document.thankYou.title}</h1><p>{document.thankYou.description}</p><span className='canvas-success'><Check size={14} /> Response successfully saved</span></> : field && <><div className='question-number'>{selectedIndex + 1}<ArrowRight size={16} /><span>{typeLabels[field.type]}{field.required ? ' · Required' : ''}</span></div><h1>{field.label}{field.required && <span className='required-star'>*</span>}</h1>{field.description && <p>{field.description}</p>}{field.type.includes('choice') ? <div className='canvas-choices'>{field.options.map((o, i) => <div key={i}><kbd>{String.fromCharCode(65 + i)}</kbd>{o}</div>)}</div> : <div className='canvas-input'>{field.type === 'email' ? 'you@example.com' : field.type === 'date' ? 'dd / mm / yyyy' : 'Type your answer here...'}</div>}<button className='canvas-next' onClick={preview}>Continue <ArrowRight size={17} /></button>{field.condition && <span className='canvas-condition'>Shown when “{document.fields.find((f) => f.id === field.condition?.fieldId)?.label}” equals “{field.condition.value}”</span>}</>}
        </div><footer className='canvas-footer'>Made with <PopMark /><strong>formpop.</strong><span>{selectedId === 'welcome' ? 'A little more human.' : selectedId === 'thanks' ? 'Thanks for being part of it.' : `${selectedIndex + 1} of ${document.fields.length}`}</span></footer></div><div className='canvas-bottom'><span><Eye size={14} />Your form, just as people will see it.</span><button onClick={preview}>Try the full experience <ArrowUpRight size={14} /></button></div></main>
        <aside className={`editor-settings ${mobilePanel === 'settings' ? 'mobile-open' : ''}`}><div className='editor-panel-title'><strong>{tab === 'design' ? 'Make it yours' : field ? 'Question settings' : 'Screen settings'}</strong><Settings2 size={16} /></div><fieldset disabled={archived || busy}>
          {tab === 'design' ? <><div className='settings-group'><h3>Your colors</h3><p>A little personality in every question.</p>{[['background', 'Background'], ['text', 'Text'], ['accent', 'Buttons & accents']].map(([id, label]) => <label key={id} className='color-setting'><span>{label}</span><span><input aria-label={`${label} color`} type='color' value={document.theme[id as keyof FormDocument['theme']]} onChange={(e) => setDocument((d) => ({ ...d, theme: { ...d.theme, [id]: e.target.value } }))} /><small>{document.theme[id as keyof FormDocument['theme']]}</small></span></label>)}</div><div className='settings-group'><h3>A ready-made mood</h3><div className='theme-presets'>{[{ background: '#f3f7f2', text: '#243d35', accent: '#287b62', name: 'Fresh mint' }, { background: '#fff2e9', text: '#5c3c2d', accent: '#b75d38', name: 'Warm hello' }, { background: '#eef3fc', text: '#293e64', accent: '#4f6ba1', name: 'Blue skies' }, { background: '#252e2a', text: '#f2f3df', accent: '#78a993', name: 'After hours' }].map(({ name, ...theme }) => <button type='button' key={name} onClick={() => setDocument((d) => ({ ...d, theme }))}><span style={{ background: theme.background }}><i style={{ background: theme.accent }} /><i style={{ background: theme.text }} /></span><small>{name}</small></button>)}</div></div><div className='settings-group'><h3>Form description</h3><Textarea aria-label='Form description' placeholder='A little about this form...' value={document.description} maxLength={1000} onChange={(e) => setDocument((d) => ({ ...d, description: e.target.value }))} /></div></> : field ? <>
            <div className='settings-group'><Label htmlFor='field-type'>Question type</Label><select id='field-type' className='pop-select' value={field.type} onChange={(e) => { const type = e.target.value as FieldType; updateField({ type, options: type.includes('choice') && !field.options.length ? ['Option one', 'Option two'] : field.options }); }}>{fieldTypes.map((t) => <option key={t} value={t}>{typeLabels[t]}</option>)}</select><Label htmlFor='question-label-input'>Question</Label><Textarea id='question-label-input' value={field.label} maxLength={200} rows={3} onChange={(e) => updateField({ label: e.target.value })} /><Label htmlFor='question-description-input'>Description <small>Optional</small></Label><Textarea id='question-description-input' placeholder='A helpful hint or a little context...' value={field.description} maxLength={1000} rows={3} onChange={(e) => updateField({ description: e.target.value })} /><div className='switch-setting'><div><Label htmlFor='question-required'>Required answer</Label><small>Don't let this one go unanswered.</small></div><Switch id='question-required' checked={field.required} onCheckedChange={(required) => updateField({ required })} /></div></div>
            {field.type.includes('choice') && <div className='settings-group'><h3>Answer choices</h3><p>One clear option at a time.</p>{field.options.map((option, index) => <div className='option-edit-row' key={index}><span>{String.fromCharCode(65 + index)}</span><Input aria-label={`Option ${index + 1}`} value={option} maxLength={200} onChange={(e) => updateField({ options: field.options.map((o, i) => i === index ? e.target.value : o) })} /><button className='icon-button' aria-label={`Remove option ${index + 1}`} disabled={field.options.length <= 1} onClick={() => updateField({ options: field.options.filter((_, i) => i !== index) })}><X size={13} /></button></div>)}<button className='text-action' disabled={field.options.length >= 30} onClick={() => updateField({ options: [...field.options, `Option ${field.options.length + 1}`] })}><Plus size={14} />Add choice</button></div>}
            <div className='settings-group'><h3>Conditional visibility</h3><p>Only ask when it makes sense.</p><select aria-label='Show question when' className='pop-select' value={field.condition?.fieldId ?? ''} onChange={(e) => updateField({ condition: e.target.value ? { fieldId: e.target.value, value: document.fields.find((f) => f.id === e.target.value)?.options[0] ?? '' } : null })}><option value=''>Always show this question</option>{document.fields.slice(0, selectedIndex).map((f) => <option key={f.id} value={f.id}>When: {f.label}</option>)}</select>{field.condition && <><Label htmlFor='condition-value'>Answer equals</Label>{document.fields.find((f) => f.id === field.condition?.fieldId)?.type.includes('choice') ? <select id='condition-value' className='pop-select' value={field.condition.value} onChange={(e) => updateField({ condition: { ...field.condition!, value: e.target.value } })}>{document.fields.find((f) => f.id === field.condition?.fieldId)?.options.map((o) => <option key={o}>{o}</option>)}</select> : <Input id='condition-value' placeholder='Exact answer to match' value={field.condition.value} maxLength={200} onChange={(e) => updateField({ condition: { ...field.condition!, value: e.target.value } })} />}<small className='settings-note'>Exact match. Multiple choice matches any selected option.</small></>}</div>
            <div className='settings-group question-actions'><div><Button variant='outline' size='sm' disabled={selectedIndex === 0} onClick={() => reorder(selectedIndex, selectedIndex - 1)}><ArrowUp />Up</Button><Button variant='outline' size='sm' disabled={selectedIndex === document.fields.length - 1} onClick={() => reorder(selectedIndex, selectedIndex + 1)}><ArrowDown />Down</Button></div><Button variant='outline' size='sm' disabled={document.fields.length >= 50} onClick={duplicateField}><Copy />Duplicate question</Button><Button variant='destructive' size='sm' disabled={document.fields.length <= 1} onClick={removeField}><Trash2 />Delete question</Button></div>
          </> : selectedId === 'welcome' ? <><div className='settings-group'><div className='switch-setting'><div><Label htmlFor='welcome-enabled'>Welcome screen</Label><small>A friendly first impression.</small></div><Switch id='welcome-enabled' checked={document.welcome.enabled} onCheckedChange={(enabled) => setDocument((d) => ({ ...d, welcome: { ...d.welcome, enabled } }))} /></div><Label htmlFor='welcome-title'>Headline</Label><Textarea id='welcome-title' value={document.welcome.title} maxLength={200} onChange={(e) => setDocument((d) => ({ ...d, welcome: { ...d.welcome, title: e.target.value } }))} /><Label htmlFor='welcome-description'>Description</Label><Textarea id='welcome-description' value={document.welcome.description} maxLength={2000} rows={4} onChange={(e) => setDocument((d) => ({ ...d, welcome: { ...d.welcome, description: e.target.value } }))} /><Label htmlFor='welcome-button'>Button text</Label><Input id='welcome-button' value={document.welcome.button} maxLength={60} onChange={(e) => setDocument((d) => ({ ...d, welcome: { ...d.welcome, button: e.target.value } }))} /></div><div className='settings-tip'><Sparkles size={18} /><strong>Make them feel welcome.</strong><p>Let people know why you're asking and how long it will take.</p></div></> : <><div className='settings-group'><Label htmlFor='thanks-title'>Headline</Label><Textarea id='thanks-title' value={document.thankYou.title} maxLength={200} onChange={(e) => setDocument((d) => ({ ...d, thankYou: { ...d.thankYou, title: e.target.value } }))} /><Label htmlFor='thanks-description'>Your message</Label><Textarea id='thanks-description' value={document.thankYou.description} maxLength={2000} rows={5} onChange={(e) => setDocument((d) => ({ ...d, thankYou: { ...d.thankYou, description: e.target.value } }))} /></div><div className='settings-tip'><Check size={18} /><strong>End on a good note.</strong><p>A thoughtful thank-you makes the whole conversation feel worth it.</p></div></>}
        </fieldset></aside>
      </div>
    </>}
    <Dialog open={addOpen} onOpenChange={setAddOpen}><DialogContent className='pop-dialog question-type-dialog'><DialogHeader><DialogTitle>What's your next question?</DialogTitle><DialogDescription>Pick the best way for someone to answer.</DialogDescription></DialogHeader><div className='field-type-grid'>{fieldTypes.map((type) => { const Icon = fieldIcons[type]; return <button key={type} onClick={() => add(type)}><span><Icon size={22} /></span><strong>{typeLabels[type]}</strong><ArrowUpRight size={14} /></button>; })}</div></DialogContent></Dialog>
    <Dialog open={previewOpen} onOpenChange={setPreviewOpen}><DialogContent className='template-preview-dialog' showCloseButton={false}><div className='template-preview-header'><div><DialogTitle>Your draft, in conversation.</DialogTitle><DialogDescription>Try the full experience. No responses will be stored.</DialogDescription></div><button className='icon-button' aria-label='Close preview' onClick={() => setPreviewOpen(false)}><X /></button></div>{previewOpen && <ConversationalForm document={document} preview compact />}</DialogContent></Dialog>
    <Dialog open={shareOpen} onOpenChange={setShareOpen}><DialogContent className='pop-dialog'><DialogHeader><div className='dialog-symbol'><Rocket /></div><DialogTitle>Ready to meet the world.</DialogTitle><DialogDescription>Your published snapshot is live. Future draft edits stay private until you publish again.</DialogDescription></DialogHeader><label className='share-link-label'>Your public link<Input readOnly aria-label='Public form URL' value={shareUrl} onFocus={(e) => e.target.select()} /></label><Button className='pop-primary' onClick={() => { void navigator.clipboard.writeText(shareUrl).then(() => toast.success('Link copied. Go start a conversation.')).catch(() => toast.error('Select the URL above to copy it manually.')); }}><Copy />Copy link</Button><Button variant='outline' asChild><a href={`/f/${saved.slug}`} target='_blank' rel='noopener noreferrer'>Open published form <ArrowUpRight /></a></Button></DialogContent></Dialog>
    <Dialog open={!!responseId} onOpenChange={(open) => !open && setResponseId(null)}><DialogContent className='pop-dialog response-detail-dialog'><DialogHeader><DialogTitle>A little more detail.</DialogTitle><DialogDescription>{response ? `Submitted ${new Date(response.createdAt).toLocaleString()}` : 'Response details'}</DialogDescription></DialogHeader>{response && <div className='response-detail'>{response.document.fields.filter((f) => response.answers[f.id] !== undefined).map((f) => <div key={f.id}><span>{f.label}</span><p>{Array.isArray(response.answers[f.id]) ? (response.answers[f.id] as string[]).join(', ') : response.answers[f.id] || <em>No answer</em>}</p></div>)}<small>Response ID: {response.id}</small></div>}</DialogContent></Dialog>
  </div>;
}
