import type { Lesson } from '@/api/types';
import { studentCaption } from '@/features/students';

import { addDays, formatTime, lessonEnd, movedFrom, sameDay, startOfDay } from '.';

/**
 * Вид плашки в расписании.
 * movedFrom — след перенесённого занятия в его старом дне; clash — пересекается с другим занятием дня;
 * homework — домашка прикреплена; noHomework — домашки нет, а до занятия меньше суток; normal — домашку давать ещё рано.
 */
export type WeekItemKind = 'normal' | 'homework' | 'noHomework' | 'past' | 'movedFrom' | 'cancelled' | 'clash';

const DAY_MS = 24 * 60 * 60 * 1000;

export interface WeekItem {
  key: string;
  lesson: Lesson;
  start: Date;
  end: Date;
  kind: WeekItemKind;
  /** «15:30–16:30». */
  range: string;
  /** Экзамен или класс и длительность: «ЕГЭ профиль · 60 мин». Статус передаёт только kind. */
  caption: string;
}

export interface WeekDay {
  date: Date;
  isToday: boolean;
  isPast: boolean;
  items: WeekItem[];
  /** Занятия, которые состоятся: без отменённых и без следов переноса. */
  liveCount: number;
}

const range = (start: Date, end: Date) => `${formatTime(start)}–${formatTime(end)}`;
/** «ЕГЭ профиль · 60 мин», «7 класс · 90 мин»; разовое отмечается отдельной строкой в разметке. */
const caption = (l: Lesson) => [studentCaption(l.student), `${l.durationMin} мин`].filter(Boolean).join(' · ');

/** Id занятий, которые состоятся и пересекаются с другим таким же — независимо от того, прошли они или нет. */
export const clashIds = (lessons: Lesson[]) => {
  const live = lessons.filter(l => l.status === 'scheduled');
  const ids = new Set<string>();
  for (const a of live)
    for (const b of live)
      if (a !== b && new Date(a.startsAt) < lessonEnd(b) && new Date(b.startsAt) < lessonEnd(a)) ids.add(a.id);
  return ids;
};

/** Вид занятия (без следа переноса): отмена → пересечение → прошло → домашка / нет домашки за сутки / ещё рано. */
/**
 * Статус домашки: есть файл (пробник — тоже домашка); нет, а до занятия меньше суток; иначе — ещё рано (null).
 * У прошедших и отменённых статуса нет.
 */
export const homeworkStatus = (l: Lesson, now: Date): 'homework' | 'noHomework' | null => {
  if (l.status === 'cancelled' || lessonEnd(l) < now) return null;
  if (l.assignments.length) return 'homework';
  return new Date(l.startsAt).getTime() - now.getTime() < DAY_MS ? 'noHomework' : null;
};

export const lessonKind = (l: Lesson, now: Date, clashes: Set<string>): Exclude<WeekItemKind, 'movedFrom'> => {
  if (l.status === 'cancelled') return 'cancelled';
  if (clashes.has(l.id)) return 'clash';
  if (lessonEnd(l) < now) return 'past';
  return homeworkStatus(l, now) ?? 'normal';
};

/** Неделя с понедельника `from`: занятия по дням, перенесённое — в обоих днях, пересечения помечены. */
export const buildWeek = (lessons: Lesson[], from: Date, now: Date): WeekDay[] => {
  const clashes = clashIds(lessons);
  return Array.from({ length: 7 }, (_, i) => {
    const date = addDays(from, i);
    const items: WeekItem[] = [];

    for (const l of lessons) {
      const start = new Date(l.startsAt);
      const end = lessonEnd(l);
      const original = movedFrom(l);

      if (original && sameDay(original, date)) {
        const originalEnd = new Date(original.getTime() + l.durationMin * 60_000);
        items.push({
          key: `${l.id}-from`,
          lesson: l,
          start: original,
          end: originalEnd,
          kind: 'movedFrom',
          range: range(original, originalEnd),
          caption: caption(l),
        });
      }
      if (!sameDay(start, date)) continue;

      items.push({
        key: l.id,
        lesson: l,
        start,
        end,
        kind: lessonKind(l, now, clashes),
        range: range(start, end),
        caption: caption(l),
      });
    }

    items.sort((a, b) => a.start.getTime() - b.start.getTime());

    return {
      date,
      isToday: sameDay(date, now),
      isPast: date < startOfDay(now),
      items,
      liveCount: items.filter(x => x.kind !== 'cancelled' && x.kind !== 'movedFrom').length,
    };
  });
};

/** Пары пересекающихся занятий для плашки-предупреждения. */
export const findClashes = (days: WeekDay[]) =>
  days.flatMap(day => {
    const clashes = day.items.filter(x => x.kind === 'clash');
    const pairs: [WeekItem, WeekItem][] = [];
    for (let i = 0; i < clashes.length; i++)
      for (let j = i + 1; j < clashes.length; j++)
        if (clashes[i]!.start < clashes[j]!.end && clashes[j]!.start < clashes[i]!.end)
          pairs.push([clashes[i]!, clashes[j]!]);
    return pairs.map(pair => ({ date: day.date, pair }));
  });

/** «5 – 11 октября» или «28 сентября – 4 октября». */
export const formatWeekRange = (from: Date) => {
  const to = addDays(from, 6);
  const full = (d: Date) => d.toLocaleDateString('ru', { day: 'numeric', month: 'long' });
  return from.getMonth() === to.getMonth() ? `${from.getDate()} – ${full(to)}` : `${full(from)} – ${full(to)}`;
};
