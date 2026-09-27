/** Shared by the contact form (client) and /api/contact (server). */

export type ContactInput = { name: string; email: string; message: string };
export type ContactErrors = Partial<Record<keyof ContactInput, string>>;

export const LIMITS = { name: 100, email: 200, message: 5000, messageMin: 10 } as const;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function validateField(field: keyof ContactInput, raw: string): string | undefined {
  const value = raw.trim();
  switch (field) {
    case "name":
      if (!value) return "Please enter your name.";
      if (value.length > LIMITS.name) return `Name must be under ${LIMITS.name} characters.`;
      return;
    case "email":
      if (!value) return "Please enter your email address.";
      if (value.length > LIMITS.email || !EMAIL_RE.test(value)) return "Please enter a valid email address.";
      return;
    case "message":
      if (!value) return "Please write a message.";
      if (value.length < LIMITS.messageMin) return `Message should be at least ${LIMITS.messageMin} characters.`;
      if (value.length > LIMITS.message) return `Message must be under ${LIMITS.message} characters.`;
      return;
  }
}

export function validateContact(input: ContactInput): ContactErrors {
  const errors: ContactErrors = {};
  for (const field of ["name", "email", "message"] as const) {
    const error = validateField(field, input[field] ?? "");
    if (error) errors[field] = error;
  }
  return errors;
}
