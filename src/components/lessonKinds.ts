import type { Tone } from '@/components/ui/tones';
import type { WeekItemKind } from '@/features/lessons/week';

/** Плашка занятия по виду: фон и обводка, цвет времени, чип для списков. Общие для расписания и Main. */
// Обводки — ring/outline внутрь: не меняют размер, плашки не прыгают при смене недели.
export const KIND: Record<WeekItemKind, { block: string; time: string; chip?: { label: string; tone: Tone } }> = {
  normal: { block: 'bg-white text-ink ring-1 ring-line ring-inset', time: 'text-label' },
  homework: { block: 'bg-ink text-white', time: 'text-accent', chip: { label: 'Домашка ✓', tone: 'neutral' } },
  noHomework: {
    block: 'bg-white text-ink outline-[length:1.5px] outline-offset-[-1.5px] outline-alert outline-dashed',
    time: 'text-danger',
    chip: { label: 'Нет домашки', tone: 'danger' },
  },
  past: { block: 'bg-chip text-label opacity-70', time: 'text-label' },
  movedFrom: {
    block: 'bg-warn-soft text-warn outline-[length:1.5px] outline-offset-[-1.5px] outline-[#d9a93a] outline-dashed',
    time: 'text-warn',
    chip: { label: 'Перенос', tone: 'warn' },
  },
  cancelled: {
    block: 'bg-danger-soft text-[#8a2309]',
    time: 'text-[#8a2309]',
    chip: { label: 'Отменено', tone: 'danger' },
  },
  clash: { block: 'bg-alert text-ink', time: 'text-ink', chip: { label: 'Пересечение', tone: 'alert' } },
};
