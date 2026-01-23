/**
 * Determines the appropriate toast variant based on the message content
 * @param message The message to analyze
 * @returns The appropriate variant: 'default', 'destructive', or 'success'
 */
export const getToastVariant = (message: string): 'default' | 'destructive' | 'success' => {
  const lowerMessage = message.toLowerCase();

  // Success-like messages (code sent, verification sent, etc.)
  if (
    lowerMessage.includes('verification code was sent') ||
    lowerMessage.includes('code sent') ||
    lowerMessage.includes('sent successfully') ||
    lowerMessage.includes('verification sent') ||
    lowerMessage.includes('please check your') ||
    lowerMessage.includes('check your phone') ||
    lowerMessage.includes('check your messages')
  ) {
    return 'success';
  }

  // Informational messages (rate limiting, cooldowns, etc.)
  if (
    lowerMessage.includes('sent recently') ||
    lowerMessage.includes('please wait') ||
    lowerMessage.includes('try again in') ||
    lowerMessage.includes('rate limit') ||
    lowerMessage.includes('too many attempts') ||
    lowerMessage.includes('cooldown')
  ) {
    return 'default';
  }

  // Phone number validation errors (treat as informational, not destructive)
  if (
    lowerMessage.includes('invalid phone number') ||
    lowerMessage.includes('phone number format') ||
    lowerMessage.includes('tanzanian numbers should be') ||
    (lowerMessage.includes('invalid') && lowerMessage.includes('phone'))
  ) {
    return 'default';
  }

  // Error messages (failed, error, invalid, etc.)
  if (
    lowerMessage.includes('failed') ||
    lowerMessage.includes('error') ||
    lowerMessage.includes('invalid') ||
    lowerMessage.includes('not found') ||
    lowerMessage.includes('unauthorized') ||
    lowerMessage.includes('forbidden') ||
    lowerMessage.includes('server error')
  ) {
    return 'destructive';
  }

  // Default to neutral for unknown messages
  return 'default';
};

/**
 * Determines appropriate toast title based on variant and content
 * @param currentTitle Current title (if any)
 * @param message Message content
 * @param variant Toast variant
 * @returns Appropriate title
 */
export const getToastTitle = (
  currentTitle: string | undefined,
  message: string,
  variant: 'default' | 'destructive' | 'success'
): string => {
  if (currentTitle) return currentTitle;

  const lowerMessage = message.toLowerCase();

  if (variant === 'success') {
    if (lowerMessage.includes('verification code was sent')) {
      return 'Code Sent Successfully';
    }
    if (lowerMessage.includes('sent successfully')) {
      return 'Sent Successfully';
    }
    return 'Success';
  }

  if (variant === 'destructive') {
    if (lowerMessage.includes('failed to send')) {
      return 'Failed to Send';
    }
    if (lowerMessage.includes('error')) {
      return 'Error';
    }
    return 'Error';
  }

  // Default variant
  if (lowerMessage.includes('sent recently')) {
    return 'Please Wait';
  }
  if (lowerMessage.includes('rate limit')) {
    return 'Rate Limited';
  }
  if (lowerMessage.includes('phone number format') || lowerMessage.includes('invalid phone number')) {
    return 'Invalid Phone Number';
  }
  return 'Notice';
};