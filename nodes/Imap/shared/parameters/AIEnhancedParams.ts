/**
 * AI-enhanced parameter configurations using $fromAI()
 * This module contains reusable $fromAI() parameter definitions
 */

/**
 * AI-enhanced email search filters with $fromAI() defaults
 */
export const AIEmailSearchFilters = {
  from: {
    default: "={{ $fromAI('sender_email', 'Email address of the sender to search for') }}",
    placeholder: "john@example.com or John Doe",
  },
  to: {
    default: "={{ $fromAI('recipient_email', 'Email address of the recipient to search for') }}",
    placeholder: "support@company.com or Support Team",
  },
  subject: {
    default: "={{ $fromAI('subject_keywords', 'Keywords to search in email subject line') }}",
    placeholder: "invoice, meeting, urgent, project update",
  },
  text: {
    default: "={{ $fromAI('content_keywords', 'Keywords to search in email body content') }}",
    placeholder: "password reset, order confirmation, delivery",
  },
  cc: {
    default: "={{ $fromAI('cc_email', 'Email address in CC field') }}",
    placeholder: "manager@company.com",
  },
  bcc: {
    default: "={{ $fromAI('bcc_email', 'Email address in BCC field') }}",
    placeholder: "admin@company.com",
  },
  uid: {
    default: "={{ $fromAI('email_uids', 'Comma-separated list of specific email UIDs to retrieve') }}",
    placeholder: "1,2,3",
  },
} as const;

/**
 * AI-enhanced content selection with smart defaults
 */
export const AIContentSelection = {
  includeParts: {
    default: "={{ $fromAI('content_types', 'Types of email content to include based on the task requirements', ['textContent', 'flags']) }}",
    description: 'Select which parts of the email to include. AI agents can choose based on their specific needs.',
  },
  headersToInclude: {
    default: "={{ $fromAI('email_headers', 'Comma-separated list of specific email headers to include for analysis') }}",
    placeholder: 'received,authentication-results,return-path,date,message-id',
  },
} as const;

/**
 * AI-enhanced mailbox operations
 */
export const AIMailboxOperations = {
  emailUid: {
    default: "={{ $fromAI('email_uid', 'UID of the email to process') }}",
    description: 'UID of the email to process',
  },
  destinationMailbox: {
    default: "={{ $fromAI('destination_mailbox', 'Name of the destination mailbox folder') }}",
    placeholder: 'INBOX, Sent, Drafts, Archive',
  },
} as const;
