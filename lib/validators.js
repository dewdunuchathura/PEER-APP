/**
 * Input validators for PEARD API
 */

// Phone number validation (E.164 format)
export function validatePhone(phone) {
  if (!phone) return false;
  const e164Regex = /^\+?[1-9]\d{1,14}$/;
  return e164Regex.test(phone.replace(/\D/g, ''));
}

// OTP code validation (6 digits)
export function validateOTP(otp) {
  if (!otp) return false;
  return /^\d{6}$/.test(otp.toString());
}

// Email validation
export function validateEmail(email) {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Name validation
export function validateName(name) {
  if (!name || typeof name !== 'string') return false;
  return name.length >= 1 && name.length <= 100;
}

// Age validation (18+) — takes integer age
export function validateAge(age) {
  const ageNum = parseInt(age);
  return ageNum >= 18 && ageNum <= 150;
}

// DOB validation — takes ISO date string (YYYY-MM-DD), enforces 18+ and not future
export function validateDOB(dateString) {
  if (!dateString) return { valid: false, reason: 'required' };
  const dob = new Date(dateString);
  if (isNaN(dob.getTime())) return { valid: false, reason: 'invalid_date' };
  const today = new Date();
  if (dob > today) return { valid: false, reason: 'future_date' };
  const age = today.getFullYear() - dob.getFullYear()
    - (today < new Date(today.getFullYear(), dob.getMonth(), dob.getDate()) ? 1 : 0);
  if (age < 18) return { valid: false, reason: 'minor' };
  return { valid: true, age };
}

// Bio validation
export function validateBio(bio) {
  if (!bio) return true; // optional
  return bio.length <= 500;
}

// Interests validation (array of strings)
export function validateInterests(interests) {
  if (!Array.isArray(interests)) return false;
  return interests.length > 0 && interests.length <= 100 &&
    interests.every(i => typeof i === 'string' && i.length > 0 && i.length <= 50);
}

// Height validation (cm)
export function validateHeight(height) {
  const h = parseInt(height);
  return h >= 100 && h <= 250;
}

// Gender validation
export function validateGender(gender) {
  return ['male', 'female', 'other'].includes(gender?.toLowerCase());
}

// Location validation
export function validateLocation(city, state) {
  return validateName(city) && validateName(state);
}

// Instagram handle validation
export function validateInstagram(handle) {
  if (!handle) return true; // optional
  return /^[a-zA-Z0-9_]{1,30}$/.test(handle);
}

// Zodiac sign validation
export function validateZodiac(sign) {
  const valid = [
    'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
    'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
  ];
  return valid.includes(sign);
}

// UUID validation
export function validateUUID(uuid) {
  if (!uuid) return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

// Action validation (like, pass, buy_drink)
export function validateAction(action) {
  return ['like', 'pass', 'buy_drink'].includes(action?.toLowerCase());
}

// Gender balance preference validation
export function validateGenderBalance(preference) {
  return ['equal', 'moreMen', 'moreWomen'].includes(preference);
}

// Amount validation (currency)
export function validateAmount(amount) {
  const a = parseFloat(amount);
  return a > 0 && a < 1000;
}

// Message content validation
export function validateMessageContent(content) {
  if (!content || typeof content !== 'string') return false;
  const trimmed = content.trim();
  return trimmed.length > 0 && trimmed.length <= 5000;
}

// Event title validation
export function validateEventTitle(title) {
  if (!title || typeof title !== 'string') return false;
  return title.length >= 3 && title.length <= 200;
}

// Validate all user profile fields
export function validateUserProfile(data) {
  const errors = [];

  if (data.first_name && !validateName(data.first_name)) {
    errors.push('Invalid first name');
  }

  if (data.last_name && !validateName(data.last_name)) {
    errors.push('Invalid last name');
  }

  if (data.email && !validateEmail(data.email)) {
    errors.push('Invalid email');
  }

  if (data.bio && !validateBio(data.bio)) {
    errors.push('Bio too long (max 500 chars)');
  }

  if (data.height_cm && !validateHeight(data.height_cm)) {
    errors.push('Invalid height (100-250 cm)');
  }

  if (data.zodiac_sign && !validateZodiac(data.zodiac_sign)) {
    errors.push('Invalid zodiac sign');
  }

  if (data.instagram_handle && !validateInstagram(data.instagram_handle)) {
    errors.push('Invalid Instagram handle');
  }

  if (data.interests && !validateInterests(data.interests)) {
    errors.push('Invalid interests');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// Validate authentication request
export function validateAuthRequest(data) {
  const errors = [];

  if (!data.phone_number || !validatePhone(data.phone_number)) {
    errors.push('Invalid phone number');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// Validate OTP verification request
export function validateVerifyOTPRequest(data) {
  const errors = [];

  if (!data.phone_number || !validatePhone(data.phone_number)) {
    errors.push('Invalid phone number');
  }

  if (!data.otp_code || !validateOTP(data.otp_code)) {
    errors.push('Invalid OTP code (must be 6 digits)');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// Sanitize string input (basic XSS prevention)
export function sanitize(str) {
  if (typeof str !== 'string') return str;
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

// Validate file upload
export function validateFileUpload(file, maxSize = 5 * 1024 * 1024) {
  if (!file) return false;
  if (file.size > maxSize) return false;
  const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  return validTypes.includes(file.type);
}
