import { yesNoValues, type Answer, type FormField } from './form-model';

// Fields that move on by themselves once a single value is picked.
export function autoAdvances(field: FormField) {
  return (
    field.type === 'single_choice' ||
    field.type === 'yes_no' ||
    field.type === 'rating' ||
    field.type === 'opinion_scale'
  );
}

// Maps a key press to the answer it selects, or null when the key means
// nothing for this field. `afterOne` is true when the previous key was "1"
// moments ago, so "1" then "0" picks 10 on an opinion scale.
export function keyAnswer(
  field: FormField,
  key: string,
  current: Answer | undefined,
  afterOne = false
): Answer | null {
  const k = key.toLowerCase();
  switch (field.type) {
    case 'single_choice':
    case 'multiple_choice': {
      if (!/^[a-z]$/.test(k)) return null;
      const option = field.options[k.charCodeAt(0) - 97];
      if (!option) return null;
      if (field.type === 'single_choice') return option;
      const selected = Array.isArray(current) ? current : [];
      return selected.includes(option)
        ? selected.filter((o) => o !== option)
        : [...selected, option];
    }
    case 'yes_no':
      return yesNoValues.find((v) => v[0].toLowerCase() === k) ?? null;
    case 'rating':
      return /^[1-5]$/.test(k) ? k : null;
    case 'opinion_scale':
      if (k === '0' && afterOne && current === '1') return '10';
      return /^[0-9]$/.test(k) ? k : null;
    default:
      return null;
  }
}
