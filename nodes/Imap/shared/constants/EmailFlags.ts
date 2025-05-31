/**
 * IMAP email flags for search and filtering
 */
export enum EmailFlags {
  Answered = 'answered',
  Deleted = 'deleted',
  Draft = 'draft',
  Flagged = 'flagged',
  Recent = 'recent',
  Seen = 'seen',
}

/**
 * IMAP protocol flag names (with backslash prefix)
 */
export enum ImapFlags {
  Answered = '\\Answered',
  Flagged = '\\Flagged',
  Deleted = '\\Deleted',
  Seen = '\\Seen',
  Draft = '\\Draft',
}

/**
 * AI-friendly descriptions for email flags
 */
export const EmailFlagsDescriptions = {
  [EmailFlags.Answered]: 'Find emails that have been replied to (answered flag set)',
  [EmailFlags.Deleted]: 'Find emails marked for deletion',
  [EmailFlags.Draft]: 'Find draft emails (unsent emails)',
  [EmailFlags.Flagged]: 'Find important/flagged emails (starred emails)',
  [EmailFlags.Recent]: 'Find recently received emails',
  [EmailFlags.Seen]: 'Find read emails (true) or unread emails (false). AI: "unread emails" = false',
} as const;
