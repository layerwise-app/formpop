export const fieldTypes = [
  'short_text',
  'long_text',
  'email',
  'number',
  'single_choice',
  'multiple_choice',
  'yes_no',
  'rating',
  'opinion_scale',
  'date'
] as const;
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
export type FormTheme = { background: string; text: string; accent: string };
export type FormDocument = {
  title: string;
  description: string;
  fields: FormField[];
  theme: FormTheme;
  welcome: {
    enabled: boolean;
    title: string;
    description: string;
    button: string;
  };
  thankYou: { title: string; description: string };
};

export const typeLabels: Record<FieldType, string> = {
  short_text: 'Short text',
  long_text: 'Long text',
  email: 'Email',
  number: 'Number',
  single_choice: 'Single choice',
  multiple_choice: 'Multiple choice',
  yes_no: 'Yes / No',
  rating: 'Rating',
  opinion_scale: 'Opinion scale',
  date: 'Date'
};

const defaultLabels: Record<FieldType, string> = {
  short_text: 'What’s your name?',
  long_text: 'Tell us more',
  email: 'What’s your email?',
  number: 'How many?',
  single_choice: 'Pick one',
  multiple_choice: 'Pick all that apply',
  yes_no: 'Would you like a follow-up?',
  rating: 'How would you rate it?',
  opinion_scale: 'How likely are you to recommend us?',
  date: 'Pick a date'
};

export const ratingValues = ['1', '2', '3', '4', '5'];
export const scaleValues = Array.from({ length: 11 }, (_, i) => String(i));
export const yesNoValues = ['Yes', 'No'];

export function isChoice(type: FieldType) {
  return type === 'single_choice' || type === 'multiple_choice';
}

// Answers a field can take from a fixed set; null for free-form fields.
export function fixedValues(field: FormField): string[] | null {
  if (isChoice(field.type)) return field.options;
  if (field.type === 'yes_no') return yesNoValues;
  if (field.type === 'rating') return ratingValues;
  if (field.type === 'opinion_scale') return scaleValues;
  return null;
}

export function newField(type: FieldType, label = ''): FormField {
  return {
    id: crypto.randomUUID(),
    type,
    label: label || defaultLabels[type],
    description: '',
    required: false,
    options: isChoice(type) ? ['Option A', 'Option B', 'Option C'] : [],
    condition: null
  };
}

export const defaultTheme: FormTheme = {
  background: '#fff6fa',
  text: '#2b1426',
  accent: '#e11d74'
};

export function blankDocument(title = 'Untitled form'): FormDocument {
  return {
    title,
    description: '',
    fields: [newField('short_text')],
    theme: { ...defaultTheme },
    welcome: { enabled: true, title, description: '', button: 'Start' },
    thankYou: {
      title: 'Thank you',
      description: 'Your response has been recorded.'
    }
  };
}

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Invalid input.');
  }
  return value as Record<string, unknown>;
}

export function inputText(value: unknown, max = 200, allowEmpty = false) {
  if (
    typeof value !== 'string' ||
    value.length > max ||
    (!allowEmpty && !value.trim())
  ) {
    throw new Error(`Please enter valid text (up to ${max} characters).`);
  }
  return value.trim();
}

export function inputId(value: unknown) {
  const id = inputText(value, 80);
  if (!/^[a-zA-Z0-9_-]+$/.test(id)) throw new Error('Invalid identifier.');
  return id;
}

function boolean(value: unknown) {
  if (typeof value !== 'boolean') throw new Error('Invalid setting.');
  return value;
}

function color(value: unknown) {
  if (typeof value !== 'string' || !/^#[0-9a-fA-F]{6}$/.test(value)) {
    throw new Error('Use a valid hex color.');
  }
  return value;
}

export function validateDocument(value: unknown): FormDocument {
  const data = record(value);
  if (
    !Array.isArray(data.fields) ||
    data.fields.length < 1 ||
    data.fields.length > 50
  ) {
    throw new Error('A form needs between 1 and 50 questions.');
  }
  const previous = new Set<string>();
  const fields = data.fields.map((raw): FormField => {
    const f = record(raw);
    const id = inputId(f.id);
    if (previous.has(id)) {
      throw new Error('Question identifiers must be unique.');
    }
    if (!fieldTypes.includes(f.type as FieldType)) {
      throw new Error('Unsupported question type.');
    }
    const type = f.type as FieldType;
    if (!Array.isArray(f.options) || f.options.length > 30) {
      throw new Error('Use up to 30 choices.');
    }
    const options = f.options.map((o) => inputText(o, 200));
    if (
      isChoice(type) &&
      (options.length < 1 || new Set(options).size !== options.length)
    ) {
      throw new Error('Choices must be nonempty and unique.');
    }
    let condition: FormField['condition'] = null;
    if (f.condition !== null && f.condition !== undefined) {
      const c = record(f.condition);
      const fieldId = inputId(c.fieldId);
      if (!previous.has(fieldId)) {
        throw new Error('Visibility rules must reference an earlier question.');
      }
      condition = { fieldId, value: inputText(c.value, 200) };
    }
    previous.add(id);
    return {
      id,
      type,
      label: inputText(f.label),
      description: inputText(f.description, 1000, true),
      required: boolean(f.required),
      // Fixed-scale questions never carry custom options.
      options: isChoice(type) ? options : [],
      condition
    };
  });
  const theme = record(data.theme);
  const welcome = record(data.welcome);
  const thanks = record(data.thankYou);
  return {
    title: inputText(data.title),
    description: inputText(data.description, 1000, true),
    fields,
    theme: {
      background: color(theme.background),
      text: color(theme.text),
      accent: color(theme.accent)
    },
    welcome: {
      enabled: boolean(welcome.enabled),
      title: inputText(welcome.title),
      description: inputText(welcome.description, 2000, true),
      button: inputText(welcome.button, 60)
    },
    thankYou: {
      title: inputText(thanks.title),
      description: inputText(thanks.description, 2000, true)
    }
  };
}

// Conditions only refer backwards. Hidden answers cannot make later fields visible.
export function visibleFields(fields: FormField[], answers: Answers) {
  const visible = new Set<string>();
  return fields.filter((field) => {
    const rule = field.condition;
    const answer = rule ? answers[rule.fieldId] : undefined;
    const show =
      !rule ||
      (visible.has(rule.fieldId) &&
        (Array.isArray(answer)
          ? answer.includes(rule.value)
          : answer === rule.value));
    if (show) visible.add(field.id);
    return show;
  });
}

export function answerError(field: FormField, answer: unknown): string | null {
  const multiple = field.type === 'multiple_choice';
  if (
    answer !== undefined &&
    (multiple ? !Array.isArray(answer) : typeof answer !== 'string')
  ) {
    return 'Please provide an answer in the correct format.';
  }
  const empty =
    answer === undefined ||
    answer === '' ||
    (Array.isArray(answer) && answer.length === 0);
  if (empty) {
    return field.required ? 'Please answer this question to continue.' : null;
  }
  if (multiple) {
    const values = answer as unknown[];
    if (
      values.length > field.options.length ||
      new Set(values).size !== values.length ||
      values.some((a) => typeof a !== 'string' || !field.options.includes(a))
    ) {
      return 'Please choose from the available options.';
    }
    return null;
  }
  const text = answer as string;
  if (text.length > (field.type === 'long_text' ? 10000 : 1000)) {
    return 'Your answer is too long or invalid.';
  }
  if (field.required && !text.trim()) {
    return 'Please answer this question to continue.';
  }
  const fixed = fixedValues(field);
  if (fixed && !fixed.includes(text)) {
    return 'Please choose an available option.';
  }
  if (field.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)) {
    return 'Please enter a valid email address.';
  }
  if (
    field.type === 'number' &&
    (!text.trim() || !Number.isFinite(Number(text)))
  ) {
    return 'Please enter a valid number.';
  }
  if (
    field.type === 'date' &&
    (!/^\d{4}-\d{2}-\d{2}$/.test(text) ||
      !Number.isFinite(Date.parse(text)) ||
      new Date(text).toISOString().slice(0, 10) !== text)
  ) {
    return 'Please enter a valid date.';
  }
  return null;
}

export function validateAnswers(document: FormDocument, raw: unknown): Answers {
  const answers = record(raw);
  const known = new Set(document.fields.map((f) => f.id));
  if (Object.keys(answers).some((id) => !known.has(id))) {
    throw new Error('Unknown question in response.');
  }
  const cleaned: Answers = {};
  for (const field of visibleFields(document.fields, answers as Answers)) {
    const answer = answers[field.id];
    const error = answerError(field, answer);
    if (error) throw new Error(`${field.label}: ${error}`);
    if (answer !== undefined) cleaned[field.id] = answer as Answer;
  }
  return cleaned;
}

export function answerText(answer: Answer | undefined) {
  if (answer === undefined) return '';
  return Array.isArray(answer) ? answer.join('; ') : answer;
}

export function csvCell(value: string) {
  // Prevent spreadsheet formulas when a respondent supplies untrusted text.
  const safe = /^[\s]*[=+@-]/.test(value) ? `'${value}` : value;
  return `"${safe.replace(/"/g, '""')}"`;
}

function luminance(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const channel = parseInt(hex.slice(i, i + 2), 16) / 255;
    return channel <= 0.03928
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// WCAG contrast ratio between two hex colors, from 1 to 21.
export function contrastRatio(a: string, b: string) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const darkInk = '#1e1220';

// Picks whichever of white or ink has more contrast on a solid theme color.
export function readableOn(hex: string) {
  return contrastRatio(hex, '#ffffff') >= contrastRatio(hex, darkInk)
    ? '#ffffff'
    : darkInk;
}
