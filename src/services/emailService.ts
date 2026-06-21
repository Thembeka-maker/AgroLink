export interface EmailLog {
  id: string;
  to: string;
  subject: string;
  body: string;
  timestamp: string;
}

const STORAGE_KEY = 'agrolink_email_logs';

export const emailService = {
  /**
   * Simulate sending an email by logging it to localStorage and dispatching a browser console log.
   */
  sendEmail(to: string, subject: string, body: string): void {
    const newLog: EmailLog = {
      id: 'email_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      to,
      subject,
      body,
      timestamp: new Date().toISOString(),
    };

    try {
      const existing = localStorage.getItem(STORAGE_KEY);
      const logs: EmailLog[] = existing ? JSON.parse(existing) : [];
      logs.unshift(newLog); // Newest first
      localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
      
      // Dispatch custom event for real-time UI updates
      window.dispatchEvent(new CustomEvent('agrolink_email_sent', { detail: newLog }));
      
      console.log(`📧 [Simulated Email Sent] To: ${to} | Subject: ${subject}`);
    } catch (e) {
      console.error('Failed to log simulated email', e);
    }
  },

  /**
   * Retrieve all sent email logs
   */
  getEmailLogs(): EmailLog[] {
    try {
      const existing = localStorage.getItem(STORAGE_KEY);
      return existing ? JSON.parse(existing) : [];
    } catch {
      return [];
    }
  },

  /**
   * Clear email logs history
   */
  clearEmailLogs(): void {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new CustomEvent('agrolink_email_sent', { detail: null }));
  }
};
