/**
 * Check if a subscription trial period has ended
 */
export function hasTrialExpired(trialEndsAt: Date | null | undefined, status: string): boolean {
  if (!trialEndsAt) {
    return false; // No trial set
  }

  const now = new Date();
  const trialEnd = new Date(trialEndsAt);

  // If status is TRIAL and trial end date has passed, trial is expired
  if (status === 'TRIAL' && now > trialEnd) {
    return true;
  }

  return false;
}

/**
 * Get remaining trial days
 */
export function getRemainingTrialDays(trialEndsAt: Date | null | undefined): number {
  if (!trialEndsAt) {
    return 0;
  }

  const now = new Date();
  const trialEnd = new Date(trialEndsAt);
  const diffTime = Math.abs(trialEnd.getTime() - now.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays > 0 ? diffDays : 0;
}

/**
 * Format trial expiry message
 */
export function formatTrialExpiryMessage(trialEndsAt: Date | null | undefined): string {
  if (!trialEndsAt) {
    return '';
  }

  const remainingDays = getRemainingTrialDays(trialEndsAt);

  if (remainingDays === 0) {
    return 'Your trial has expired';
  } else if (remainingDays === 1) {
    return 'Your trial expires tomorrow';
  } else {
    return `Your trial expires in ${remainingDays} days`;
  }
}
