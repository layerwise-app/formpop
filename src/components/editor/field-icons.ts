import {
  AlignLeft,
  CalendarDays,
  CircleDot,
  Gauge,
  Hash,
  ListChecks,
  Mail,
  Star,
  ToggleRight,
  Type,
  type LucideIcon
} from 'lucide-react';
import type { FieldType } from '~/lib/form-model';

export const fieldIcons: Record<FieldType, LucideIcon> = {
  short_text: Type,
  long_text: AlignLeft,
  email: Mail,
  number: Hash,
  single_choice: CircleDot,
  multiple_choice: ListChecks,
  yes_no: ToggleRight,
  rating: Star,
  opinion_scale: Gauge,
  date: CalendarDays
};
