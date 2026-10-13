export const fieldTypes = ['short_text', 'long_text', 'email', 'number', 'single_choice', 'multiple_choice', 'date'] as const;
export type FieldType = (typeof fieldTypes)[number];
export type Answer = string | string[];
export type Answers = Record<string, Answer>;
export type FormField = {
  id: string;
  type: FieldType;
  label: string;
  description: string;
  required: boolean;
  options: string[];
  condition: { fieldId: string; value: string } | null;
};
export type FormDocument = {
  title: string;
  description: string;
  fields: FormField[];
  theme: { background: string; text: string; accent: string };
  welcome: { enabled: boolean; title: string; description: string; button: string };
  thankYou: { title: string; description: string };
};

export const typeLabels: Record<FieldType, string> = {
  short_text: 'Short text', long_text: 'Long text', email: 'Email', number: 'Number',
  single_choice: 'Single choice', multiple_choice: 'Multiple choice', date: 'Date',
};

export function newField(type: FieldType, label = ''): FormField {
  return {
    id: crypto.randomUUID(), type, label: label || `Your ${typeLabels[type].toLowerCase()} question`,
    description: '', required: false,
    options: type.includes('choice') ? ['Option one', 'Option two', 'Option three'] : [], condition: null,
  };
}

export function blankDocument(title = 'Untitled form'): FormDocument {
  return {
    title, description: '', fields: [newField('short_text', "What's your name?")],
    theme: { background: '#f3f7f2', text: '#243d35', accent: '#287b62' },
    welcome: { enabled: true, title: "Let's start a conversation.", description: 'A few thoughtful questions. A little more connection.', button: "Let's begin" },
    thankYou: { title: "You're all set. Thank you!", description: 'Your response made it to the right place. We appreciate your time.' },
  };
}

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid input.');
  return value as Record<string, unknown>;
}
export function inputText(value: unknown, max = 200, allowEmpty = false): string {
  if (typeof value !== 'string' || value.length > max || (!allowEmpty && !value.trim())) throw new Error(`Please enter valid text (up to ${max} characters).`);
  return value.trim();
}
export function inputId(value: unknown): string {
  const id = inputText(value, 80);
  if (!/^[a-zA-Z0-9_-]+$/.test(id)) throw new Error('Invalid identifier.');
  return id;
}
function boolean(value: unknown): boolean {
  if (typeof value !== 'boolean') throw new Error('Invalid setting.');
  return value;
}
export function validateDocument(value: unknown): FormDocument {
  const data = record(value);
  if (!Array.isArray(data.fields) || data.fields.length < 1 || data.fields.length > 50) throw new Error('A form needs between 1 and 50 questions.');
  const previous = new Set<string>();
  const fields = data.fields.map((raw): FormField => {
    const f = record(raw);
    const id = inputId(f.id);
    if (previous.has(id)) throw new Error('Question identifiers must be unique.');
    if (!fieldTypes.includes(f.type as FieldType)) throw new Error('Unsupported question type.');
    const type = f.type as FieldType;
    if (!Array.isArray(f.options) || f.options.length > 30) throw new Error('Use up to 30 choices.');
    const options = f.options.map((o) => inputText(o, 200));
    if (type.includes('choice') && (options.length < 1 || new Set(options).size !== options.length)) throw new Error('Choices must be nonempty and unique.');
    let condition: FormField['condition'] = null;
    if (f.condition !== null && f.condition !== undefined) {
      const c = record(f.condition);
      const fieldId = inputId(c.fieldId);
      if (!previous.has(fieldId)) throw new Error('Visibility rules must reference an earlier question.');
      condition = { fieldId, value: inputText(c.value, 200) };
    }
    previous.add(id);
    return { id, type, label: inputText(f.label), description: inputText(f.description, 1000, true), required: boolean(f.required), options, condition };
  });
  const t = record(data.theme);
  const color = (v: unknown) => {
    if (typeof v !== 'string' || !/^#[0-9a-fA-F]{6}$/.test(v)) throw new Error('Use a valid hex color.');
    return v;
  };
  const w = record(data.welcome);
  const thanks = record(data.thankYou);
  return {
    title: inputText(data.title), description: inputText(data.description, 1000, true), fields,
    theme: { background: color(t.background), text: color(t.text), accent: color(t.accent) },
    welcome: { enabled: boolean(w.enabled), title: inputText(w.title), description: inputText(w.description, 2000, true), button: inputText(w.button, 60) },
    thankYou: { title: inputText(thanks.title), description: inputText(thanks.description, 2000, true) },
  };
}

// Conditions only refer backwards. Hidden answers cannot make later fields visible.
export function visibleFields(fields: FormField[], answers: Answers): FormField[] {
  const visible = new Set<string>();
  return fields.filter((field) => {
    const rule = field.condition;
    const answer = rule ? answers[rule.fieldId] : undefined;
    const show = !rule || (visible.has(rule.fieldId) && (Array.isArray(answer) ? answer.includes(rule.value) : answer === rule.value));
    if (show) visible.add(field.id);
    return show;
  });
}

export function answerError(field: FormField, answer: unknown): string | null {
  if (answer !== undefined && (field.type === 'multiple_choice' ? !Array.isArray(answer) : typeof answer !== 'string')) return 'Please provide an answer in the correct format.';
  const empty = answer === undefined || answer === '' || (Array.isArray(answer) && answer.length === 0);
  if (empty) return field.required ? 'Please answer this question to continue.' : null;
  if (field.type === 'multiple_choice') {
    if (!Array.isArray(answer) || answer.length > field.options.length || new Set(answer).size !== answer.length || answer.some((a) => typeof a !== 'string' || !field.options.includes(a))) return 'Please choose from the available options.';
    return null;
  }
  if (typeof answer !== 'string' || answer.length > (field.type === 'long_text' ? 10000 : 1000)) return 'Your answer is too long or invalid.';
  if (field.required && !answer.trim()) return 'Please answer this question to continue.';
  if (field.type === 'single_choice' && !field.options.includes(answer)) return 'Please choose an available option.';
  if (field.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(answer)) return 'Please enter a valid email address.';
  if (field.type === 'number' && (!answer.trim() || !Number.isFinite(Number(answer)))) return 'Please enter a valid number.';
  if (field.type === 'date' && (!/^\d{4}-\d{2}-\d{2}$/.test(answer) || !Number.isFinite(Date.parse(answer)) || new Date(answer).toISOString().slice(0, 10) !== answer)) return 'Please enter a valid date.';
  return null;
}

export function validateAnswers(document: FormDocument, raw: unknown): Answers {
  const answers = record(raw);
  const known = new Set(document.fields.map((f) => f.id));
  if (Object.keys(answers).some((id) => !known.has(id))) throw new Error('Unknown question in response.');
  const cleaned: Answers = {};
  for (const field of visibleFields(document.fields, answers as Answers)) {
    const answer = answers[field.id];
    const error = answerError(field, answer);
    if (error) throw new Error(`${field.label}: ${error}`);
    if (answer !== undefined) cleaned[field.id] = answer as Answer;
  }
  return cleaned;
}

export const templateInfo = [
  { id: 'feedback', title: 'Customer feedback', description: 'Good listening makes great products.', category: 'Feedback', color: 'mint', icon: 'message', questions: 5 },
  { id: 'contact', title: 'Say hello', description: 'Make the first connection a good one.', category: 'Contact', color: 'peach', icon: 'wave', questions: 4 },
  { id: 'event', title: 'Event registration', description: 'Bring your people together.', category: 'Registration', color: 'lavender', icon: 'calendar', questions: 5 },
  { id: 'research', title: 'A little about you', description: 'Get to know the people behind the data.', category: 'Research', color: 'blue', icon: 'users', questions: 5 },
  { id: 'application', title: 'Join our team', description: 'Find your next great teammate.', category: 'Application', color: 'yellow', icon: 'spark', questions: 5 },
  { id: 'survey', title: 'Quick pulse check', description: 'Small questions. Meaningful insights.', category: 'Survey', color: 'rose', icon: 'heart', questions: 4 },
] as const;
export type TemplateId = (typeof templateInfo)[number]['id'];

export function templateDocument(id: string): FormDocument {
  const info = templateInfo.find((t) => t.id === id);
  const doc = blankDocument(info?.title ?? 'Untitled form');
  if (!info) return doc;
  doc.description = info.description;
  const field = (type: FieldType, label: string, options: string[] = [], required = true) => ({ ...newField(type, label), options, required });
  const name = field('short_text', "First things first, what's your name?");
  const email = field('email', 'Where can we reach you?');
  const sets: Record<TemplateId, FormField[]> = {
    feedback: [name, field('single_choice', 'How has your experience been?', ['Love it', 'Pretty good', 'Could be better']), field('multiple_choice', 'What matters most to you?', ['Ease of use', 'Design', 'Features', 'Support']), field('long_text', 'What could we do better?', [], false), email],
    contact: [name, email, field('single_choice', 'What brings you here?', ['A project', 'A question', 'Just saying hello']), field('long_text', 'Tell us a little more.')],
    event: [name, email, field('date', 'Which date works for you?'), field('number', 'How many people are joining?'), field('long_text', 'Any dietary needs or anything else?', [], false)],
    research: [name, field('single_choice', 'How often do you use our product?', ['Every day', 'A few times a week', 'Occasionally']), field('multiple_choice', 'What do you use it for?', ['Work', 'Personal projects', 'Learning']), field('long_text', 'What would make it even better?'), email],
    application: [name, email, field('single_choice', 'Which role are you interested in?', ['Design', 'Engineering', 'Marketing']), field('long_text', 'Tell us about something you are proud of.'), field('date', 'When could you start?')],
    survey: [field('single_choice', 'How are things going?', ['Great', 'Okay', 'Not so great']), field('short_text', 'What is one thing going well?'), field('long_text', 'What is one thing we could improve?'), email],
  };
  doc.fields = sets[info.id];
  doc.welcome.title = id === 'feedback' ? 'A better experience starts with you.' : info.title;
  doc.welcome.description = `${info.description} This will only take a couple of minutes.`;
  if (id === 'contact') doc.theme = { background: '#fff2e9', text: '#5c3c2d', accent: '#b75d38' };
  if (id === 'event') doc.theme = { background: '#f0edfa', text: '#423a62', accent: '#72629e' };
  return doc;
}

export function csvCell(value: string): string {
  // Prevent spreadsheet formulas when a respondent supplies untrusted text.
  const safe = /^[\s]*[=+@-]/.test(value) ? `'${value}` : value;
  return `"${safe.replace(/"/g, '""')}"`;
}
