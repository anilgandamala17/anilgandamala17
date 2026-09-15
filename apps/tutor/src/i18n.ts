import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
    en: {
        translation: {
            // Landing & Auth
            appName: 'Aɪra',
            tagline: 'Your Personalized AI Learning Companion',
            askMeAnything: '"Ask Aɪra anything..."',
            continueWithGoogle: 'Continue with Google',
            continueWithApple: 'Continue with Apple',
            signInWithEmail: 'Sign in with Email',
            continueAsGuest: 'Continue as Guest',
            skipForDemo: 'Skip login for demo',

            // Auth forms
            email: 'Email',
            password: 'Password',
            confirmPassword: 'Confirm Password',
            forgotPassword: 'Forgot Password?',
            resetPassword: 'Reset Password',
            signIn: 'Sign In',
            signUp: 'Sign Up',
            createAccount: 'Create Account',
            alreadyHaveAccount: 'Already have an account?',
            noAccount: "Don't have an account?",

            // Onboarding
            selectProfession: 'Select Your Profession',
            selectProfessionDesc: 'Choose your field to personalize your learning experience',
            selectSpecialization: 'Select Your Specialization',
            selectTopic: 'Choose a Topic to Learn',
            startLearning: 'Start Learning',

            // Professions
            medicine: 'Medicine',
            medicineDesc: 'Medical sciences, clinical practice, healthcare',
            engineering: 'Engineering',
            engineeringDesc: 'Technical disciplines and applied sciences',
            law: 'Law',
            lawDesc: 'Legal studies, jurisprudence, practice',
            business: 'Business',
            businessDesc: 'Management, finance, entrepreneurship',
            science: 'Science',
            scienceDesc: 'Natural and physical sciences',
            arts: 'Arts',
            artsDesc: 'Creative arts, humanities, culture',
            technology: 'Technology',
            technologyDesc: 'Software, IT, digital systems',
            education: 'Education',
            educationDesc: 'Teaching, pedagogy, learning sciences',
            finance: 'Finance',
            financeDesc: 'Banking, investments, economics',
            architecture: 'Architecture',
            architectureDesc: 'Design, urban planning, construction',
            psychology: 'Psychology',
            psychologyDesc: 'Human behavior, mental health',
            other: 'Other',
            otherDesc: 'Explore other fields',

            // Teaching
            chat: 'Chat',
            teaching: 'Teaching',
            studio: 'Studio',
            askAQuestion: 'Ask a question...',
            sendMessage: 'Send',
            pause: 'Pause',
            resume: 'Resume',
            nextStep: 'Next Step',
            previousStep: 'Previous',

            // Doubt resolution
            askingAbout: 'Asking about',
            resolving: 'Resolving your doubt...',
            understood: 'I understand now',
            needMoreHelp: 'I need more help',

            // Resources
            notes: 'Notes',
            mindMap: 'Mind Map',
            flashcards: 'Flashcards',
            generateNotes: 'Generate Notes',
            generateMindMap: 'Generate Mind Map',
            generateFlashcards: 'Generate Flashcards',
            downloadPdf: 'Download PDF',

            // Session
            sessionComplete: 'Session Complete!',
            topicsLearned: 'Topics Learned',
            doubtsResolved: 'Doubts Resolved',
            progress: 'Progress',
            continueToNext: 'Continue to Next Topic',
            reviewMaterials: 'Review Materials',

            // Settings
            settings: 'Settings',
            account: 'Account',
            learning: 'Learning',
            accessibility: 'Accessibility',
            aiTutor: 'AI Tutor',
            privacy: 'Privacy & Data',

            // Common
            save: 'Save',
            cancel: 'Cancel',
            close: 'Close',
            back: 'Back',
            next: 'Next',
            loading: 'Loading...',
            error: 'Error',
            success: 'Success',
        }
    }
};

i18n
    .use(initReactI18next)
    .init({
        resources,
        lng: (() => {
            try {
                const raw = localStorage.getItem('ai-tutor-settings');
                return raw ? JSON.parse(raw)?.state?.settings?.language || 'en' : 'en';
            } catch { return 'en'; }
        })(),
        fallbackLng: 'en',
        interpolation: {
            escapeValue: false
        }
    });

// Function to change language dynamically
export const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
};

export default i18n;
