import { ApiError } from './http.js';

export const privacyNotice = {
  version: '1',
  sections: [
    {
      title: 'What PC-CRAFT collects',
      text: 'Your first and last name, email address, account role and status, password hash, sign-in session records, and privacy acknowledgment. Learning records include lesson progress and completion, quiz attempts and answers, and saved assembly and troubleshooting attempts when those features send records to the server. PC-CRAFT also stores feedback you submit and records some account and administrative actions in system logs. Quiz drafts and some lab activity can be saved in your browser.',
    },
    {
      title: 'How we use it',
      text: 'PC-CRAFT uses this data to operate accounts, resume learning activities, score quizzes, track progress, and support authorized instructor and administrator review. Session records support sign-in and recent-activity indicators. Feedback helps the project team understand and respond to issues.',
    },
    {
      title: 'Who can access it',
      text: 'Learners can view their own learning records through the app. Authorized instructors use the administrator role. Administrators can view account details, recent session activity, and counts of completed lessons, submitted quizzes, and lab attempts. Super administrators can also review system logs and submitted feedback.',
    },
    {
      title: 'How long we keep it',
      text: '[Project owner to supply the retention periods and deletion or anonymization rules for account, learning, acknowledgment, and operational records.]',
    },
    {
      title: 'How we protect it',
      text: 'PC-CRAFT stores password hashes and session-token hashes on the server. Sign-in sessions expire, and the server checks account roles and record ownership where applicable. If you choose Remember me, this browser keeps your sign-in token across browser sessions.',
    },
    {
      title: 'Your choices and requests',
      text: 'Contact the project team to request access to or correction of your information, ask about deletion or withdrawing consent, or raise a privacy concern. Include the email associated with your account so the team can identify it. Declining the acknowledgment signs you out and leaves any existing account and records in place.',
    },
    {
      title: 'Privacy contact',
      text: '[Project owner to supply the Data Protection Officer or designated administrator’s name and contact details.]',
    },
  ],
};

export const currentConsentField = `EXISTS (
  SELECT 1 FROM privacy_consents c WHERE c.user_id = u.user_id AND c.notice_version = ?
) AS privacy_accepted`;

export function requireCurrentNotice(version) {
  if (version !== privacyNotice.version) {
    throw new ApiError(409, 'PRIVACY_NOTICE_CHANGED', 'The Privacy Notice has changed. Please review the current version.');
  }
}

export async function recordConsent(db, userId, version) {
  await db.execute(`
    INSERT INTO privacy_consents (user_id, notice_version) VALUES (?,?)
    ON DUPLICATE KEY UPDATE accepted_at = accepted_at`, [userId, version]);
}

export function requirePrivacyConsent(req, res, next) {
  if (!req.user.privacy_accepted) {
    throw new ApiError(403, 'PRIVACY_CONSENT_REQUIRED', 'Review and accept the current Privacy Notice to continue.');
  }
  next();
}
