import type { PortalLesson } from '@/api/types';
import { lessonEnd } from '@/features/lessons';

/**
 * Кабинет ученика: ближайшее состоявшееся занятие, остальные будущие (вместе с отменёнными)
 * и домашки прошедших занятий — свежие сверху. Пробники — отдельным блоком.
 */
export const splitPortalLessons = (lessons: PortalLesson[], now: Date) => {
  const future = lessons.filter(l => lessonEnd(l) > now);
  const next = future.find(l => l.status === 'scheduled');
  const past = lessons
    .filter(l => lessonEnd(l) <= now && l.status === 'scheduled')
    .flatMap(l => l.assignments.filter(a => a.kind === 'homework').map(a => ({ ...a, startsAt: l.startsAt })))
    .reverse();
  return { next, upcoming: future.filter(l => l !== next), past };
};

/** Перенесён, если время по правилу не совпадает с фактическим. */
export const isMoved = (l: PortalLesson) => !!l.originalStartsAt && l.originalStartsAt !== l.startsAt;
