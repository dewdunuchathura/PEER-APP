/**
 * QR Code Scanner using html5-qrcode library
 * Works with device camera in real-time
 */

export async function initQRScanner(elementId, onScanSuccess, onScanError) {
  try {
    const { Html5QrcodeScanner } = await import('html5-qrcode');

    const scanner = new Html5QrcodeScanner(
      elementId,
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        rememberLastUsedCamera: true,
        aspectRatio: 1.0,
        videoConstraints: {
          facingMode: 'environment' // Use back camera on mobile
        }
      },
      /* verbose= */ false
    );

    // On successful scan
    scanner.render(
      (decodedText, decodedResult) => {
        if (onScanSuccess) {
          onScanSuccess(decodedText);
        }
        // Stop scanner after successful scan
        scanner.clear();
      },
      (error) => {
        // Ignore errors during scanning - it keeps trying
        if (onScanError && error.toString().includes('NotFound')) {
          onScanError(error);
        }
      }
    );

    return scanner;
  } catch (error) {
    console.error('Failed to initialize QR scanner:', error);
    throw error;
  }
}

/**
 * Stop QR scanner
 */
export function stopQRScanner(scanner) {
  if (scanner) {
    scanner.clear();
  }
}

/**
 * Generate QR code data for event check-in
 * Format: peard://event/{eventId}
 */
export function generateEventQRData(eventId) {
  return `peard://event/${eventId}`;
}

/**
 * Parse QR code data
 */
export function parseQRData(qrData) {
  try {
    if (qrData.startsWith('peard://event/')) {
      const eventId = qrData.replace('peard://event/', '');
      return {
        type: 'event_checkin',
        eventId,
        isValid: eventId.length > 0
      };
    }
    return { type: 'unknown', isValid: false };
  } catch (error) {
    console.error('Failed to parse QR data:', error);
    return { type: 'error', isValid: false };
  }
}

export default {
  initQRScanner,
  stopQRScanner,
  generateEventQRData,
  parseQRData
};
