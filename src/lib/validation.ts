/**
 * Input validation and sanitization utilities
 */

/**
 * Sanitize a string to prevent XSS attacks
 * Removes potentially dangerous characters and HTML tags
 */
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }
  
  // Remove HTML tags
  let sanitized = input.replace(/<[^>]*>/g, '');
  
  // Remove potentially dangerous characters
  sanitized = sanitized.replace(/[<>'"&]/g, '');
  
  // Trim whitespace
  sanitized = sanitized.trim();
  
  return sanitized;
}

/**
 * Validate and sanitize a URL parameter
 */
export function sanitizeUrlParam(param: string | null): string {
  if (!param) {
    return '';
  }
  
  // Decode URL encoding
  try {
    param = decodeURIComponent(param);
  } catch {
    // If decoding fails, return empty string
    return '';
  }
  
  // Sanitize the decoded string
  return sanitizeString(param);
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate class level (1-12)
 */
export function isValidClassLevel(classLevel: string): boolean {
  const num = parseInt(classLevel, 10);
  return !isNaN(num) && num >= 1 && num <= 12;
}

/**
 * Sanitize and validate lesson ID
 */
export function sanitizeLessonId(subject: string, topic: string): string {
  const sanitizedSubject = sanitizeString(subject);
  const sanitizedTopic = sanitizeString(topic);
  
  return `${sanitizedSubject}-${sanitizedTopic}`
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .substring(0, 100); // Limit length
}

