import {
  blankDocument,
  newField,
  type FieldType,
  type FormDocument,
  type FormField,
  type FormTheme
} from './form-model';

export const themePresets = [
  {
    id: 'pop',
    name: 'Pop pink',
    theme: { background: '#fff6fa', text: '#2b1426', accent: '#e11d74' }
  },
  {
    id: 'ink',
    name: 'Ink',
    theme: { background: '#1a1420', text: '#f7eef4', accent: '#ff5ca8' }
  },
  {
    id: 'lilac',
    name: 'Lilac',
    theme: { background: '#f6f2ff', text: '#2a2340', accent: '#7351d8' }
  },
  {
    id: 'tangerine',
    name: 'Tangerine',
    theme: { background: '#fff5ec', text: '#3a2213', accent: '#e8590c' }
  },
  {
    id: 'ocean',
    name: 'Ocean',
    theme: { background: '#eef6fb', text: '#0f2a3d', accent: '#1d6fd8' }
  },
  {
    id: 'paper',
    name: 'Paper',
    theme: { background: '#fbfaf7', text: '#1f1d1a', accent: '#1f1d1a' }
  }
] as const satisfies readonly { id: string; name: string; theme: FormTheme }[];
export type ThemePresetId = (typeof themePresets)[number]['id'];

function preset(id: ThemePresetId): FormTheme {
  return { ...themePresets.find((p) => p.id === id)!.theme };
}

export const templateInfo = [
  {
    id: 'feedback',
    title: 'Product feedback',
    description: 'Rating, NPS and what to fix next.',
    category: 'Feedback',
    questions: 5
  },
  {
    id: 'contact',
    title: 'Contact form',
    description: 'Route messages by topic.',
    category: 'Contact',
    questions: 4
  },
  {
    id: 'event',
    title: 'Event RSVP',
    description: 'Guest count only for people who say yes.',
    category: 'Events',
    questions: 5
  },
  {
    id: 'research',
    title: 'Research screener',
    description: 'Find the right people for interviews.',
    category: 'Research',
    questions: 5
  },
  {
    id: 'application',
    title: 'Job application',
    description: 'Role, portfolio and start date.',
    category: 'Hiring',
    questions: 6
  },
  {
    id: 'survey',
    title: 'Team pulse',
    description: 'A weekly check-in in under a minute.',
    category: 'Survey',
    questions: 5
  }
] as const;
export type TemplateId = (typeof templateInfo)[number]['id'];

function field(
  type: FieldType,
  label: string,
  options: string[] = [],
  required = true
): FormField {
  return { ...newField(type, label), options, required };
}

function when(target: FormField, source: FormField, value: string) {
  target.condition = { fieldId: source.id, value };
  return target;
}

type TemplateContent = {
  theme: ThemePresetId;
  welcome: string;
  intro: string;
  thanks: [string, string];
  fields: () => FormField[];
};

const content: Record<TemplateId, TemplateContent> = {
  feedback: {
    theme: 'pop',
    welcome: 'How are we doing?',
    intro: 'Five quick questions. Your answers go straight to the product team.',
    thanks: ['Thanks for the feedback', 'We read every response.'],
    fields: () => [
      field('rating', 'How would you rate your experience so far?'),
      field('opinion_scale', 'How likely are you to recommend us to a friend?'),
      field('multiple_choice', 'What do you value most?', [
        'Ease of use',
        'Design',
        'Speed',
        'Support'
      ]),
      field('long_text', 'What should we improve first?', [], false),
      field('email', 'Want a reply? Leave your email.', [], false)
    ]
  },
  contact: {
    theme: 'paper',
    welcome: 'Get in touch',
    intro: 'We reply within one business day.',
    thanks: ['Message sent', 'We’ll get back to you soon.'],
    fields: () => [
      field('short_text', 'What’s your name?'),
      field('email', 'What’s your email?'),
      field('single_choice', 'What’s this about?', [
        'A new project',
        'Support',
        'Partnership',
        'Something else'
      ]),
      field('long_text', 'How can we help?')
    ]
  },
  event: {
    theme: 'tangerine',
    welcome: 'You’re invited',
    intro: 'Let us know if you can make it.',
    thanks: ['You’re on the list', 'We’ll send details closer to the date.'],
    fields: () => {
      const attending = field('yes_no', 'Will you be there?');
      return [
        field('short_text', 'What’s your name?'),
        field('email', 'What’s your email?'),
        attending,
        when(field('number', 'How many guests are you bringing?'), attending, 'Yes'),
        when(field('long_text', 'Any dietary needs?', [], false), attending, 'Yes')
      ];
    }
  },
  research: {
    theme: 'ocean',
    welcome: 'Help shape what we build next',
    intro: 'Selected participants get a 30-minute call and a thank-you gift.',
    thanks: ['Thanks for signing up', 'We’ll reach out if it’s a match.'],
    fields: () => {
      const call = field('yes_no', 'Are you open to a 30-minute video call?');
      return [
        field('single_choice', 'How often do you use the product?', [
          'Every day',
          'Every week',
          'Every month',
          'Rarely'
        ]),
        field('multiple_choice', 'What do you mainly use it for?', [
          'Work',
          'Side projects',
          'Learning',
          'Something else'
        ]),
        field('rating', 'How easy was it to get started?'),
        call,
        when(field('email', 'Where should we send the invite?'), call, 'Yes')
      ];
    }
  },
  application: {
    theme: 'ink',
    welcome: 'Apply to join the team',
    intro: 'Six questions. No cover letter needed.',
    thanks: ['Application received', 'We review every application within a week.'],
    fields: () => [
      field('short_text', 'What’s your full name?'),
      field('email', 'What’s your email?'),
      field('single_choice', 'Which role are you applying for?', [
        'Design',
        'Engineering',
        'Marketing',
        'Operations'
      ]),
      field('short_text', 'Link to your portfolio or LinkedIn', [], false),
      field('long_text', 'Tell us about a project you’re proud of.'),
      field('date', 'When could you start?')
    ]
  },
  survey: {
    theme: 'lilac',
    welcome: 'Weekly pulse',
    intro: 'Anonymous. Under a minute.',
    thanks: ['Thanks for checking in', 'See you next week.'],
    fields: () => [
      field('opinion_scale', 'How energized did you feel at work this week?'),
      field('rating', 'How well is your team communicating?'),
      field('short_text', 'What went well?', [], false),
      field('long_text', 'What’s getting in your way?', [], false),
      field('yes_no', 'Would you like to talk about it 1:1?')
    ]
  }
};

export function templateDocument(id: string): FormDocument {
  const info = templateInfo.find((t) => t.id === id);
  if (!info) return blankDocument();
  const template = content[info.id];
  const doc = blankDocument(info.title);
  doc.description = info.description;
  doc.fields = template.fields();
  doc.theme = preset(template.theme);
  doc.welcome = {
    enabled: true,
    title: template.welcome,
    description: template.intro,
    button: 'Start'
  };
  doc.thankYou = { title: template.thanks[0], description: template.thanks[1] };
  return doc;
}
