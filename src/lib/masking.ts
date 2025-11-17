// src/lib/masking.ts

/**
 * Masks a full name, showing only the first letter of the first name.
 * Example: "John Smith" → "J•••"
 */
export function maskName(fullName: string | null): string {
  if (!fullName) return "";
  const trimmed = fullName.trim();
  if (!trimmed) return "";
  
  const [first, ...rest] = trimmed.split(" ");
  if (!first) return "•••";
  
  const visible = first[0];
  const maskedLength = Math.max(first.length - 1, 3);
  return `${visible}${"•".repeat(maskedLength)}`;
}

/**
 * Masks an email address, showing only the first 3 characters of the username.
 * Example: "john.smith@example.com" → "joh•••••@example.com"
 */
export function maskEmail(email: string | null): string {
  if (!email) return "";
  const trimmed = email.trim();
  if (!trimmed) return "••••••";
  
  const [user, domain] = trimmed.split("@");
  if (!user || !domain) return "••••••";
  
  const visibleUser = user.slice(0, Math.min(3, user.length));
  const maskedLength = Math.max(user.length - visibleUser.length, 5);
  return `${visibleUser}${"•".repeat(maskedLength)}@${domain}`;
}

/**
 * Masks a phone number, showing only the first 3 digits.
 * Example: "(250) 555-1234" → "250•••••••"
 */
export function maskPhone(phone: string | null): string {
  if (!phone) return "";
  const trimmed = phone.trim();
  if (!trimmed) return "••••";
  
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length <= 4) return "••••";
  
  const visible = digits.slice(0, 3);
  const maskedLength = Math.max(digits.length - 3, 4);
  return `${visible}${"•".repeat(maskedLength)}`;
}

