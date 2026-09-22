import { logger } from './logger';

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;

let twilioClient = null;

/**
 * Initialize Twilio client with error checking
 */
function getTwilioClient() {
  try {
    if (twilioClient) {
      return twilioClient;
    }

    // Check if Twilio credentials exist
    if (!TWILIO_ACCOUNT_SID) {
      logger.warn('TWILIO_ACCOUNT_SID not configured');
      return null;
    }

    if (!TWILIO_AUTH_TOKEN) {
      logger.warn('TWILIO_AUTH_TOKEN not configured');
      return null;
    }

    if (!TWILIO_PHONE_NUMBER) {
      logger.warn('TWILIO_PHONE_NUMBER not configured');
      return null;
    }

    // Attempt to import Twilio
    try {
      const twilio = require('twilio');
      twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
      logger.info('Twilio client initialized successfully');
      return twilioClient;
    } catch (importError) {
      logger.error('Failed to import Twilio library', importError);
      return null;
    }
  } catch (error) {
    logger.error('Error in getTwilioClient', error);
    return null;
  }
}

/**
 * Generate random 6-digit OTP with validation
 */
export function generateOTP() {
  try {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    if (!/^\d{6}$/.test(otp)) {
      logger.error('Generated invalid OTP format', { otp });
      throw new Error('Invalid OTP format generated');
    }

    logger.debug('OTP generated successfully', { otpLength: otp.length });
    return otp;
  } catch (error) {
    logger.error('Error generating OTP', error);
    throw new Error('Failed to generate OTP');
  }
}

/**
 * Validate phone number format
 */
function validatePhoneNumber(phoneNumber) {
  try {
    // E.164 format: +1234567890
    const e164Regex = /^\+[1-9]\d{1,14}$/;
    
    if (!phoneNumber || !e164Regex.test(phoneNumber)) {
      logger.warn('Invalid phone number format', { phoneNumber });
      return false;
    }

    logger.debug('Phone number validated', { phoneNumber });
    return true;
  } catch (error) {
    logger.error('Error validating phone number', error);
    return false;
  }
}

/**
 * Send OTP via SMS using Twilio with comprehensive error handling
 */
export async function sendOTPviaSMS(phoneNumber, otpCode) {
  const logContext = { phoneNumber, otpCodeLength: otpCode.length };

  try {
    logger.info('Attempting to send OTP via SMS', logContext);

    // Validate inputs
    if (!phoneNumber) {
      logger.error('Phone number missing', logContext);
      throw new Error('Phone number is required');
    }

    if (!validatePhoneNumber(phoneNumber)) {
      logger.error('Invalid phone number format', { phoneNumber });
      throw new Error('Invalid phone number format');
    }

    if (!otpCode || !/^\d{6}$/.test(otpCode)) {
      logger.error('Invalid OTP code', { otpCodeLength: otpCode?.length });
      throw new Error('Invalid OTP code format');
    }

    // Get Twilio client
    const client = getTwilioClient();

    if (!client) {
      logger.warn('Twilio not configured, running in demo mode', logContext);
      return {
        success: true,
        mode: 'demo',
        message: 'Demo mode - Twilio not configured'
      };
    }

    if (!TWILIO_PHONE_NUMBER) {
      logger.error('Twilio phone number not configured', logContext);
      throw new Error('Twilio phone number not configured');
    }

    // Send SMS
    try {
      logger.info('Sending SMS via Twilio', { 
        from: TWILIO_PHONE_NUMBER, 
        to: phoneNumber 
      });

      const message = await client.messages.create({
        body: `Your PEARD verification code is: ${otpCode}. Valid for 10 minutes. Do not share this code.`,
        from: TWILIO_PHONE_NUMBER,
        to: phoneNumber
      });

      logger.info('SMS sent successfully', {
        messageSid: message.sid,
        status: message.status,
        phoneNumber
      });

      return {
        success: true,
        mode: 'live',
        messageSid: message.sid,
        status: message.status,
        message: 'OTP sent successfully'
      };
    } catch (twilioError) {
      logger.error('Twilio API error', {
        error: twilioError.message,
        code: twilioError.code,
        status: twilioError.status,
        phoneNumber
      });

      // Check for specific Twilio errors
      if (twilioError.code === 21211) {
        throw new Error('Invalid phone number format');
      } else if (twilioError.code === 21214) {
        throw new Error('Phone number does not accept SMS');
      } else if (twilioError.code === 21408) {
        throw new Error('Account suspended or permission denied');
      } else if (twilioError.status === 401) {
        throw new Error('Twilio authentication failed - check credentials');
      }

      throw new Error(`SMS delivery failed: ${twilioError.message}`);
    }
  } catch (error) {
    logger.error('sendOTPviaSMS failed', {
      error: error.message,
      phoneNumber,
      stack: error.stack
    });
    throw error;
  }
}

/**
 * Send OTP via Email (placeholder for future implementation)
 */
export async function sendOTPviaEmail(email, otpCode) {
  try {
    logger.info('Email OTP requested (not yet implemented)', { email });
    // TODO: Implement SendGrid or similar
    return {
      success: false,
      mode: 'todo',
      message: 'Email OTP not yet implemented'
    };
  } catch (error) {
    logger.error('sendOTPviaEmail error', error);
    throw new Error('Failed to send OTP via email');
  }
}

/**
 * Verify OTP is still valid (not expired) with detailed logging
 */
export function isOTPValid(otpCreatedAt, maxAgeMinutes = 10) {
  try {
    const now = new Date();
    const createdTime = new Date(otpCreatedAt);

    // Check if date is valid
    if (isNaN(createdTime.getTime())) {
      logger.error('Invalid OTP creation date', { otpCreatedAt });
      return false;
    }

    const ageMinutes = (now - createdTime) / (1000 * 60);
    const isValid = ageMinutes < maxAgeMinutes;

    logger.debug('OTP validity check', {
      createdAt: createdTime.toISOString(),
      ageMinutes: ageMinutes.toFixed(2),
      maxAgeMinutes,
      isValid
    });

    if (!isValid) {
      logger.warn('OTP expired', {
        ageMinutes: ageMinutes.toFixed(2),
        maxAgeMinutes
      });
    }

    return isValid;
  } catch (error) {
    logger.error('Error checking OTP validity', error);
    return false;
  }
}

/**
 * Get OTP service health status
 */
export function getOTPServiceStatus() {
  try {
    const client = getTwilioClient();
    const status = {
      twilio: {
        configured: !!client,
        accountSid: TWILIO_ACCOUNT_SID ? '***configured***' : 'missing',
        authToken: TWILIO_AUTH_TOKEN ? '***configured***' : 'missing',
        phoneNumber: TWILIO_PHONE_NUMBER || 'missing',
        mode: client ? 'live' : 'demo'
      },
      timestamp: new Date().toISOString()
    };

    logger.info('OTP service status check', status);
    return status;
  } catch (error) {
    logger.error('Error getting OTP service status', error);
    return {
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

export default {
  generateOTP,
  sendOTPviaSMS,
  sendOTPviaEmail,
  isOTPValid,
  getOTPServiceStatus
};
