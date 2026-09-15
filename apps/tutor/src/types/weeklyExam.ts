/** Weekly Sat/Sun competitive exam schedules (admin-controlled). */

export type WeeklyExamDay = 'saturday' | 'sunday';
export type WeeklyExamMode = 'mock' | 'pyq';
export type WeeklyExamStatus = 'draft' | 'published' | 'archived';
export type WeeklyExamWindowState = 'upcoming' | 'live' | 'ended' | 'locked';

export interface WeeklyExamSession {
  id: string;
  weekKey: string;
  day: WeeklyExamDay;
  title: string;
  examId: string;
  subjectId?: string;
  mode: WeeklyExamMode;
  startsAt: string;
  endsAt: string;
  status: WeeklyExamStatus;
  createdBy: string;
  updatedAt: string;
}

export type WeeklyExamSessionInput = Omit<WeeklyExamSession, 'id' | 'updatedAt' | 'createdBy'> & {
  id?: string;
  createdBy?: string;
};
