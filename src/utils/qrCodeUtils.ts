// QR Code utility for 2FA setup
import * as QRCode from 'qrcode';

export interface QRCodeData {
  qr_code: string;
  secret_key: string;
  manual_entry_key: string;
}

export const generate2FAQRCode = async (
  accountName: string,
  secretKey: string,
  issuer: string = 'SENDA'
): Promise<QRCodeData> => {
  try {
    // Generate TOTP URI
    const totpUri = `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(accountName)}?secret=${secretKey}&issuer=${encodeURIComponent(issuer)}`;

    // Generate QR code as data URL
    const qrCodeDataUrl = await QRCode.toDataURL(totpUri, {
      width: 256,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    return {
      qr_code: qrCodeDataUrl,
      secret_key: secretKey,
      manual_entry_key: secretKey
    };
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw new Error('Failed to generate QR code');
  }
};

export const generateRandomSecretKey = (): string => {
  // Generate a 32-character base32 secret key
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let result = '';
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};
