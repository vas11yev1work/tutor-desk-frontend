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
}
