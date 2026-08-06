const getSessionTimeoutMinutes = (): number => {
  const value = process.env.WEB_SESSION_TIMEOUT_IN_MINUTES;

  if (!value) {
    throw new Error('WEB_SESSION_TIMEOUT_IN_MINUTES is not set');
  }

  return parseInt(value, 10);
};

export const sessionTimeoutMinutes = getSessionTimeoutMinutes();
export const sessionTimeoutMs = sessionTimeoutMinutes * 60 * 1000;
export const sessionTimeoutSeconds = sessionTimeoutMinutes * 60;
export const sessionTimeoutMetaRefreshContent = `${sessionTimeoutSeconds};url=/session-timed-out?lang=en`;
