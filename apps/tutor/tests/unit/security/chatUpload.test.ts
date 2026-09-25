import { describe, expect, it } from 'vitest';
import {
  MAX_CHAT_UPLOAD_BYTES,
  getChatUploadRejection,
  isImageLikeFile,
} from '@/utils/imageVision';

function fakeFile(name: string, type: string, size: number): File {
  const blob = new Blob([new Uint8Array(Math.min(size, 64))], { type });
  const file = new File([blob], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
}

describe('chat upload validation', () => {
  it('accepts common images under the size cap', () => {
    expect(getChatUploadRejection(fakeFile('a.png', 'image/png', 1024))).toBeNull();
    expect(getChatUploadRejection(fakeFile('a.jpg', 'image/jpeg', 1024))).toBeNull();
  });

  it('rejects oversized files', () => {
    const msg = getChatUploadRejection(
      fakeFile('big.jpg', 'image/jpeg', MAX_CHAT_UPLOAD_BYTES + 1),
    );
    expect(msg).toMatch(/too large/i);
  });

  it('rejects SVG and unsupported types', () => {
    expect(isImageLikeFile({ name: 'x.svg', type: 'image/svg+xml' })).toBe(false);
    expect(getChatUploadRejection(fakeFile('x.svg', 'image/svg+xml', 100))).toMatch(
      /Unsupported|too large/i,
    );
    expect(getChatUploadRejection(fakeFile('x.exe', 'application/octet-stream', 100))).toMatch(
      /Unsupported/i,
    );
  });

  it('allows pdf/docx/text', () => {
    expect(getChatUploadRejection(fakeFile('notes.pdf', 'application/pdf', 100))).toBeNull();
    expect(
      getChatUploadRejection(
        fakeFile(
          'notes.docx',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          100,
        ),
      ),
    ).toBeNull();
    expect(getChatUploadRejection(fakeFile('a.txt', 'text/plain', 100))).toBeNull();
  });
});
