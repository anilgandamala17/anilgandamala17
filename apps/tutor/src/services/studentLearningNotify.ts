/** Tiny bus so learning stores can request a cloud/local flush without circular imports. */

type LearningFlush = () => void;

let flush: LearningFlush | null = null;
let applyingRemote = false;

export function registerStudentLearningFlush(fn: LearningFlush): void {
  flush = fn;
}

export function beginRemoteLearningApply(): void {
  applyingRemote = true;
}

export function endRemoteLearningApply(): void {
  applyingRemote = false;
}

export function isApplyingRemoteLearning(): boolean {
  return applyingRemote;
}

export function notifyStudentLearningChanged(): void {
  if (applyingRemote) return;
  flush?.();
}
