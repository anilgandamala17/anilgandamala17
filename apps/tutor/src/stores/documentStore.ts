import { create } from 'zustand';
import { extractTextFromFile } from '../utils/documentParser';

export type DocumentStatus = 'idle' | 'processing' | 'ready' | 'error';

interface DocumentStore {
    fileName: string | null;
    fileText: string | null;
    status: DocumentStatus;
    errorMessage: string | null;

    // Actions
    uploadDocument: (file: File) => Promise<void>;
    clearDocument: () => void;
}

export const useDocumentStore = create<DocumentStore>((set) => ({
    fileName: null,
    fileText: null,
    status: 'idle',
    errorMessage: null,

    uploadDocument: async (file: File) => {
        set({ status: 'processing', errorMessage: null, fileName: file.name });
        try {
            const text = await extractTextFromFile(file);
            if (!text || text.trim().length < 10) {
                throw new Error('The document appears to be empty or could not be read.');
            }
            set({ fileText: text, status: 'ready' });
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Failed to read document.';
            set({ status: 'error', errorMessage: msg, fileName: null, fileText: null });
        }
    },

    clearDocument: () => {
        set({ fileName: null, fileText: null, status: 'idle', errorMessage: null });
    },
}));
