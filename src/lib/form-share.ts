const entities: Record<string, string> = {
  '&': '&amp;',
  '"': '&quot;',
  '<': '&lt;',
  '>': '&gt;'
};

// The title is user-written; escape it so the snippet stays valid HTML.
export function embedSnippet(url: string, title: string) {
  const safe = (text: string) => text.replace(/[&"<>]/g, (c) => entities[c]);
  return `<iframe src="${safe(url)}" title="${safe(title)}" width="100%" height="600" style="border:0;border-radius:12px" loading="lazy"></iframe>`;
}
