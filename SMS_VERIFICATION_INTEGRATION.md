# SMS Verification API Integration

## Summary

Successfully integrated the SMS verification API endpoints from your backend documentation into the frontend application. All endpoints are now properly configured and linked.

## Changes Made

### 1. **API Configuration (`src/config/api.ts`)**
- Updated SMS endpoints to match the documentation
- Removed deprecated endpoints (`SEND_VERIFICATION_LINK`, `VERIFY_ACCOUNT_LINK`, `RESEND_VERIFICATION_LINK`)
- Now using the standard endpoints:
  - `SEND_CODE` - Send verification code with message type
  - `VERIFY_CODE` - Verify SMS code
  - `FORGOT_PASSWORD` - Request password reset
  - `RESET_PASSWORD` - Reset password with verification code
  - `CONFIRM_ACCOUNT` - Confirm account (requires authentication)

### 2. **useSMSVerification Hook (`src/hooks/useSMSVerification.ts`)**
- **`sendVerificationCode`**: Now accepts `message_type` parameter (`verification`, `password_reset`, `account_confirmation`)
- **`verifyCode`**: Updated to use `verification_code` field name
- **`resetPassword`**: Now requires `new_password_confirm` field (as per documentation)
- **`sendAccountVerification`**: Uses `SEND_CODE` endpoint with `message_type: 'account_confirmation'`
- **`verifyAccount`**: Uses `CONFIRM_ACCOUNT` endpoint with authentication token
- **`resendAccountVerification`**: Simplified to reuse `sendAccountVerification`

### 3. **AuthContext (`src/contexts/AuthContext.tsx`)**
- Updated `verifyAccount` interface to accept only `code` parameter (not `phoneNumber` and `code`)
- Function now properly calls the backend with authentication token
- Handles user verification status update after successful verification

### 4. **AccountVerification Component (`src/components/auth/AccountVerification.tsx`)**
- Updated to use new `verifyAccount` signature
- Now passes verification code as object: `{ verification_code: code }`

### 5. **ForgotPassword Page (`src/pages/ForgotPassword.tsx`)**
- Already properly configured with correct function signatures
- Uses `message_type: 'password_reset'` when resending codes
- Includes `new_password_confirm` field in reset password request

## API Endpoints Implemented

### 1. User Registration with SMS Verification
**Endpoint:** `POST /api/auth/register/`
- Automatically sends verification code on registration
- Response includes `sms_verification` object with confirmation

### 2. Send Verification Code
**Endpoint:** `POST /api/auth/sms/send-code/`
**Message Types:**
- `verification` - General verification
- `password_reset` - Password reset verification
- `account_confirmation` - Account confirmation verification

**Request:**
```json
{
  "phone_number": "+255700000001",
  "message_type": "verification"
}
```

### 3. Verify Phone Code
**Endpoint:** `POST /api/auth/sms/verify-code/`
**Request:**
```json
{
  "phone_number": "+255700000001",
  "verification_code": "123456"
}
```

### 4. Forgot Password via SMS
**Endpoint:** `POST /api/auth/sms/forgot-password/`
**Request:**
```json
{
  "phone_number": "+255700000001"
}
```

### 5. Reset Password via SMS
**Endpoint:** `POST /api/auth/sms/reset-password/`
**Request:**
```json
{
  "phone_number": "+255700000001",
  "verification_code": "123456",
  "new_password": "newpassword123",
  "new_password_confirm": "newpassword123"
}
```

### 6. Confirm Account via SMS
**Endpoint:** `POST /api/auth/sms/confirm-account/`
**Requires:** JWT Authentication token
**Request:**
```json
{
  "verification_code": "123456"
}
```

## Security Features

- ✅ Rate Limiting: Maximum 5 verification attempts
- ✅ Code Expiration: Codes expire after 10 minutes
- ✅ Lockout Period: 30-minute lockout after failed attempts
- ✅ Code Format: 6-digit numeric codes only
- ✅ JWT Authentication: Required for account confirmation

## Phone Number Format

- **Required Format**: International format with country code
- **Example**: `+255700000001` (Tanzania)
- **Accepted Formats**: `+255700000001`, `0700000001`, `255700000001`
- Frontend automatically normalizes phone numbers

## Message Types

The SMS verification system supports three message types:

1. **`verification`** - General verification code
2. **`password_reset`** - Password reset verification code
3. **`account_confirmation`** - Account confirmation code

## Verification Flow

### Account Registration Flow
1. User registers with phone number
2. Backend automatically sends verification code
3. User receives SMS with 6-digit code
4. User enters code to confirm account
5. Account is verified and user can access dashboard

### Password Reset Flow
1. User clicks "Forgot Password"
2. User enters phone number
3. User receives SMS with verification code
4. User enters code and new password
5. Password is reset successfully

### Account Confirmation Flow (After Login)
1. Logged-in user needs to verify account
2. System sends SMS with confirmation code
3. User enters code
4. Account is confirmed with authentication token

## Error Handling

All endpoints return appropriate error messages:
- Invalid verification code
- Code expiration
- Rate limiting exceeded
- Authentication required
- Network errors

## Testing

To test the SMS verification flow:

1. **Register a new account** at `/signup`
2. Check your phone for the verification code
3. Enter the code when prompted
4. Verify account is confirmed

For password reset:
1. Go to `/forgot-password`
2. Enter your phone number
3. Receive SMS code
4. Enter code and new password
5. Reset password successfully

## Notes

- All SMS verification messages follow the format from the documentation
- Codes expire after 10 minutes
- Maximum 5 attempts before lockout
- Account confirmation requires JWT authentication
- Phone numbers are automatically normalized to backend format

