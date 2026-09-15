/**
 * Validation utilities for form inputs and user data
 */

export interface ValidationResult {
    isValid: boolean;
    error?: string;
}

/**
 * Validates email format
 */
export function validateEmail(email: string): ValidationResult {
    if (!email || email.trim() === '') {
        return { isValid: false, error: 'Email is required' };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return { isValid: false, error: 'Please enter a valid email address' };
    }

    return { isValid: true };
}

/**
 * Validates password strength
 */
export function validatePassword(password: string, minLength: number = 8): ValidationResult {
    if (!password || password.trim() === '') {
        return { isValid: false, error: 'Password is required' };
    }

    if (password.length < minLength) {
        return { isValid: false, error: `Password must be at least ${minLength} characters long` };
    }

    // Check for at least one uppercase letter
    if (!/[A-Z]/.test(password)) {
        return { isValid: false, error: 'Password must contain at least one uppercase letter' };
    }

    // Check for at least one lowercase letter
    if (!/[a-z]/.test(password)) {
        return { isValid: false, error: 'Password must contain at least one lowercase letter' };
    }

    // Check for at least one number
    if (!/[0-9]/.test(password)) {
        return { isValid: false, error: 'Password must contain at least one number' };
    }

    return { isValid: true };
}

/**
 * Validates required field
 */
export function validateRequired(value: string | null | undefined, fieldName: string = 'Field'): ValidationResult {
    if (!value || value.trim() === '') {
        return { isValid: false, error: `${fieldName} is required` };
    }
    return { isValid: true };
}

/**
 * Validates minimum length
 */
export function validateMinLength(value: string, minLength: number, fieldName: string = 'Field'): ValidationResult {
    if (value.length < minLength) {
        return { isValid: false, error: `${fieldName} must be at least ${minLength} characters long` };
    }
    return { isValid: true };
}

/**
 * Validates maximum length
 */
export function validateMaxLength(value: string, maxLength: number, fieldName: string = 'Field'): ValidationResult {
    if (value.length > maxLength) {
        return { isValid: false, error: `${fieldName} must be no more than ${maxLength} characters long` };
    }
    return { isValid: true };
}

/**
 * Validates URL format
 */
export function validateURL(url: string): ValidationResult {
    if (!url || url.trim() === '') {
        return { isValid: false, error: 'URL is required' };
    }

    try {
        new URL(url);
        return { isValid: true };
    } catch {
        return { isValid: false, error: 'Please enter a valid URL' };
    }
}

/**
 * Validates phone number (basic)
 */
export function validatePhone(phone: string): ValidationResult {
    if (!phone || phone.trim() === '') {
        return { isValid: false, error: 'Phone number is required' };
    }

    // Remove common formatting characters
    const cleaned = phone.replace(/[\s-()]/g, '');
    
    // Check if it's all digits and reasonable length
    if (!/^\d+$/.test(cleaned)) {
        return { isValid: false, error: 'Phone number must contain only digits' };
    }

    if (cleaned.length < 10 || cleaned.length > 15) {
        return { isValid: false, error: 'Phone number must be between 10 and 15 digits' };
    }

    return { isValid: true };
}

/**
 * Sanitizes user input to prevent XSS
 */
export function sanitizeInput(input: string): string {
    const div = document.createElement('div');
    div.textContent = input;
    return div.innerHTML;
}

/**
 * Validates and sanitizes text input
 */
export function validateAndSanitizeText(text: string, options?: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    fieldName?: string;
}): ValidationResult & { sanitized?: string } {
    const { required = false, minLength, maxLength, fieldName = 'Field' } = options || {};

    if (required) {
        const requiredCheck = validateRequired(text, fieldName);
        if (!requiredCheck.isValid) {
            return requiredCheck;
        }
    }

    if (minLength !== undefined) {
        const minCheck = validateMinLength(text, minLength, fieldName);
        if (!minCheck.isValid) {
            return minCheck;
        }
    }

    if (maxLength !== undefined) {
        const maxCheck = validateMaxLength(text, maxLength, fieldName);
        if (!maxCheck.isValid) {
            return maxCheck;
        }
    }

    const sanitized = sanitizeInput(text);
    return { isValid: true, sanitized };
}
