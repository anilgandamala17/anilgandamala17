/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_FIREBASE_API_KEY?: string;
    readonly VITE_FIREBASE_AUTH_DOMAIN?: string;
    readonly VITE_FIREBASE_PROJECT_ID?: string;
    readonly VITE_FIREBASE_STORAGE_BUCKET?: string;
    readonly VITE_FIREBASE_MESSAGING_SENDER_ID?: string;
    readonly VITE_FIREBASE_APP_ID?: string;
    readonly VITE_FIREBASE_MEASUREMENT_ID?: string;
    readonly VITE_ANALYTICS_DEBUG?: string;
    readonly VITE_USE_CACHED_CURRICULUM?: string;
    readonly VITE_ALLOW_RUNTIME_AI?: string;
    readonly VITE_LANDING_ORIGIN?: string;
    readonly VITE_DEV_ORIGIN?: string;
    readonly VITE_HMR_CLIENT_PORT?: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}

declare module '*.css' {
    const content: string;
    export default content;
}

declare module '*.svg' {
    const content: string;
    export default content;
}

declare module '*.svg?url' {
    const src: string;
    export default src;
}
