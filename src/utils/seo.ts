type Meta = { title: string } | { name: string; content: string } | { property: string; content: string };

export function seo({ title, description }: { title: string; description?: string }) {
  const tags: Meta[] = [
    { title },
    { property: 'og:type', content: 'website' },
    { property: 'og:title', content: title },
    { name: 'twitter:card', content: 'summary' },
    { name: 'twitter:title', content: title }
  ];
  if (description) {
    tags.push(
      { name: 'description', content: description },
      { property: 'og:description', content: description },
      { name: 'twitter:description', content: description }
    );
  }
  return tags;
}
