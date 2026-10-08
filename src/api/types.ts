/** GET /api/auth/me */
export interface Me {
  authenticated: true;
}

export type Exam = 'oge' | 'ege_profile' | 'ege_base';

/** GET /api/s/:token */
export interface StudentPublic {
  name: string;
  grade: number | null;
  exam: Exam | null;
  /** Тема портала, задаёт репетитор. */
  theme: string;
  /** Обложка шапки; null — фон в клетку. */
  coverId: string | null;
  /** Максимальный первичный балл экзамена; null — без экзамена. */
  examMax: number | null;
}

/** GET /api/s/:token/lessons?from=&to= — урезанное занятие; перенос виден по originalStartsAt ≠ startsAt. */
export interface PortalLesson {
  id: string;
  startsAt: string;
  originalStartsAt: string | null;
  durationMin: number;
  status: LessonStatus;
  assignments: Pick<Assignment, 'id' | 'kind' | 'fileName'>[];
}

/** GET /api/s/:token/mocks — по порядку выдачи. */
export interface PortalMock {
  id: string;
  number: number;
  fileName: string;
  lessonStartsAt: string;
  /** Первичный балл; null — ещё не проверен. */
  total: number | null;
}

/** GET /api/admin/students */
export interface Student {
  id: string;
  name: string;
  grade: number | null;
  exam: Exam | null;
  contact: string | null;
  notes: string | null;
  /** Тема кабинета ученика (id из features/theme). */
  theme: string;
  /** Обложка шапки портала; null — нет, в шапке фон в клетку. */
  coverId: string | null;
  accessToken: string;
  createdAt: string;
  updatedAt: string;
}

export type LessonStatus = 'scheduled' | 'cancelled';

/** PDF-задание: домашка или пробник. Файл — GET /api/admin/assignments/:id/file. */
export interface Assignment {
  id: string;
  kind: 'homework' | 'mock';
  lessonId: string | null;
  fileName: string;
  /** Байты. */
  size: number;
  createdAt: string;
  /** Только у пробника: первичные баллы по номерам заданий; null — ещё не проверен. */
  scores: number[] | null;
  /** Сумма scores — первичный балл. */
  total: number | null;
  comment: string | null;
}

/** GET /api/admin/exams — максимальный первичный балл за каждое задание, по порядку номеров. */
export type ExamMaxScores = Record<Exam, number[]>;

/** GET /api/admin/lessons?from=&to= — перенесённое приходит и в старом, и в новом диапазоне. */
export interface Lesson {
  id: string;
  seriesId: string | null;
  startsAt: string;
  durationMin: number;
  status: LessonStatus;
  /** Время по правилу; null у разовых. */
  originalStartsAt: string | null;
  isModified: boolean;
  student: Pick<Student, 'id' | 'name' | 'grade' | 'exam'>;
  /** Домашки и пробники занятия, по порядку загрузки. */
  assignments: Assignment[];
}

/** GET /api/admin/students/:id/series — действующие правила, по одному на день недели. */
export interface Series {
  id: string;
  studentId: string;
  /** 1–7, ISO: 1 — понедельник. */
  weekday: number;
  /** 'HH:MM' в поясе timezone. */
  startTime: string;
  durationMin: number;
  timezone: string;
  /** 'YYYY-MM-DD'. */
  startsOn: string;
  /** 'YYYY-MM-DD' включительно; null — бессрочно. */
  endsOn: string | null;
}
