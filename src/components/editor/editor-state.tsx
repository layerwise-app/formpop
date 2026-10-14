import { createContext, useContext, useState } from 'react';
import { useBlocker } from '@tanstack/react-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { FormDocument } from '~/lib/form-model';
import { getForm, publishForm, saveForm, setAccepting } from '~/lib/forms.functions';

export type SavedForm = Awaited<ReturnType<typeof getForm>>;
export const editorTabs = ['build', 'design', 'share', 'responses', 'analytics'] as const;
export type EditorTab = (typeof editorTabs)[number];

export function editorSearch(search: Record<string, unknown>): { tab: EditorTab } {
  return { tab: editorTabs.find((t) => t === search.tab) ?? 'build' };
}

export function useEditorState(initial: SavedForm) {
  const queryClient = useQueryClient();
  const [saved, setSaved] = useState(initial);
  const [document, setDocument] = useState<FormDocument>(initial.draft);
  const dirty = JSON.stringify(document) !== JSON.stringify(saved.draft);

  useBlocker({
    shouldBlockFn: ({ current, next }) =>
      dirty &&
      current.pathname !== next.pathname &&
      !window.confirm('You have unsaved changes. Leave without saving?'),
    enableBeforeUnload: dirty
  });

  async function persist() {
    const updated = await saveForm({
      data: { id: saved.id, revision: saved.revision, document }
    });
    setSaved(updated);
    setDocument(updated.draft);
    void queryClient.invalidateQueries({ queryKey: ['forms'] });
    return updated;
  }

  const save = useMutation({
    mutationFn: persist,
    onSuccess: () => toast.success('Saved'),
    onError: (e) => toast.error(e.message)
  });

  const publish = useMutation({
    mutationFn: async () => {
      const current = dirty ? await persist() : saved;
      const result = await publishForm({ data: saved.id });
      setSaved({
        ...current,
        activePublicationId: result.publicationId,
        status: 'published',
        publishedRevision: current.revision
      });
      return result;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['forms'] });
      toast.success('Published');
    },
    onError: (e) => toast.error(e.message)
  });

  const accepting = useMutation({
    mutationFn: (value: boolean) =>
      setAccepting({ data: { id: saved.id, accepting: value } }),
    onSuccess: (result) => {
      setSaved((s) => ({ ...s, accepting: result.accepting }));
      void queryClient.invalidateQueries({ queryKey: ['forms'] });
      toast.success(result.accepting ? 'Accepting responses' : 'Form closed');
    },
    onError: (e) => toast.error(e.message)
  });

  const busy = save.isPending || publish.isPending;
  const archived = saved.status === 'archived';
  const live = saved.status === 'published';
  // Draft edits are private until published again.
  const unpublished = live && (dirty || saved.revision !== saved.publishedRevision);

  return {
    saved,
    document,
    setDocument,
    dirty,
    save,
    publish,
    accepting,
    busy,
    archived,
    live,
    unpublished,
    locked: archived || busy
  };
}

export type EditorState = ReturnType<typeof useEditorState>;
export const EditorContext = createContext<EditorState | null>(null);

export function useEditor() {
  const editor = useContext(EditorContext);
  if (!editor) throw new Error('useEditor must be used inside the form editor.');
  return editor;
}
