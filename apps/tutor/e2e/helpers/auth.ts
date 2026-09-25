import type { Page } from '@playwright/test';

/** Seed a student demo session before the SPA boots (MockAuthBridge reads localStorage). */
export async function seedStudentDemo(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const session = {
      uid: 'demo_e2e_student',
      email: 'demo-student@aitutor.app',
      displayName: 'Demo Student',
      role: 'student',
      emailVerified: true,
      photoURL: null,
      providerId: 'password',
      createdAt: new Date().toISOString(),
    };
    localStorage.setItem('aira:demo-session', JSON.stringify(session));
    localStorage.setItem('aira:role', 'student');
  });
}

export async function seedMalformedDemoSession(page: Page): Promise<void> {
  await page.addInitScript(() => {
    localStorage.setItem('aira:demo-session', '{broken');
  });
}
