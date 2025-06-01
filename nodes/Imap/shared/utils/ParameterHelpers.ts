import { SearchObject } from "imapflow";
import { IDataObject, IExecuteFunctions } from "n8n-workflow";

/**
 * Parameter processing utilities for email operations
 */

/**
 * Enhances search terms for AI Simple Mode with intelligent fuzzy matching
 */
function enhanceSearchTermForAI(searchTerm: string, fieldType: 'email' | 'subject' | 'content'): string {
  if (!searchTerm || searchTerm.trim() === '') {
    return searchTerm;
  }

  const trimmed = searchTerm.trim();

  // If it's already a wildcard pattern or email address, don't modify
  if (trimmed.includes('*') || trimmed.includes('@') || trimmed.startsWith('"')) {
    return trimmed;
  }

  // For email fields (from/to), add wildcards around names for fuzzy matching
  if (fieldType === 'email') {
    // If it looks like a partial name (no spaces, no dots, not an email)
    if (!trimmed.includes(' ') && !trimmed.includes('.') && !trimmed.includes('@')) {
      return `*${trimmed}*`;
    }
    // If it contains spaces, it's likely a full name
    if (trimmed.includes(' ')) {
      return `*${trimmed}*`;
    }
  }

  // For subject and content, use the term as-is (IMAP search handles partial matching)
  return trimmed;
}

/**
 * Extracts email search parameters from node context and converts to IMAP SearchObject
 */
export function getEmailSearchParametersFromNode(context: IExecuteFunctions, itemIndex: number): SearchObject {
  var searchObject: SearchObject = {};

  // Check interface mode to determine parameter handling
  const interfaceMode = context.getNodeParameter('interfaceMode', itemIndex, 'ai_simple') as string;

  // First try direct AI parameters (for AI Agent usage)
  const fromEmailDirect = context.getNodeParameter('From_Email_Address', itemIndex, '', { extractValue: true }) as string;
  const subjectDirect = context.getNodeParameter('Subject_Contains', itemIndex, '', { extractValue: true }) as string;
  const contentDirect = context.getNodeParameter('Email_Content_Contains', itemIndex, '', { extractValue: true }) as string;
  const toEmailDirect = context.getNodeParameter('To_Email_Address', itemIndex, '', { extractValue: true }) as string;
  const sinceDateDirect = context.getNodeParameter('Since_Date', itemIndex, '', { extractValue: true }) as string;
  const beforeDateDirect = context.getNodeParameter('Before_Date', itemIndex, '', { extractValue: true }) as string;

  // AI Simple Mode specific parameters
  const showUnreadOnly = context.getNodeParameter('Show_Unread_Only', itemIndex, false, { extractValue: true }) as boolean;

  // Use direct AI parameters if provided
  if (fromEmailDirect && fromEmailDirect.trim() !== '') {
    const enhanced = interfaceMode === 'ai_simple'
      ? enhanceSearchTermForAI(fromEmailDirect, 'email')
      : fromEmailDirect;
    searchObject.from = enhanced;
  }
  if (subjectDirect && subjectDirect.trim() !== '') {
    const enhanced = interfaceMode === 'ai_simple'
      ? enhanceSearchTermForAI(subjectDirect, 'subject')
      : subjectDirect;
    searchObject.subject = enhanced;
  }
  if (contentDirect && contentDirect.trim() !== '') {
    const enhanced = interfaceMode === 'ai_simple'
      ? enhanceSearchTermForAI(contentDirect, 'content')
      : contentDirect;
    searchObject.body = enhanced;
  }
  if (toEmailDirect && toEmailDirect.trim() !== '') {
    const enhanced = interfaceMode === 'ai_simple'
      ? enhanceSearchTermForAI(toEmailDirect, 'email')
      : toEmailDirect;
    searchObject.to = enhanced;
  }
  if (sinceDateDirect && sinceDateDirect.trim() !== '') {
    searchObject.since = new Date(sinceDateDirect);
  }
  if (beforeDateDirect && beforeDateDirect.trim() !== '') {
    searchObject.before = new Date(beforeDateDirect);
  }

  // Handle AI Simple Mode unread filter
  if (interfaceMode === 'ai_simple' && showUnreadOnly) {
    searchObject.seen = false; // false means unread emails only
  }

  // Only process collection parameters in advanced/human modes to avoid conflicts
  if (interfaceMode === 'ai_advanced' || interfaceMode === 'human_full') {
    // Date range processing (fallback to collection parameters)
    const emailDateRangeObj = context.getNodeParameter('emailDateRange', itemIndex, {}) as IDataObject;
    const since = emailDateRangeObj['since'] as string;
    const before = emailDateRangeObj['before'] as string;

    if (since && !searchObject.since) {
      searchObject.since = new Date(since);
    }
    if (before && !searchObject.before) {
      searchObject.before = new Date(before);
    }

    // Email flags processing
    const emailFlagsObj = context.getNodeParameter('emailFlags', itemIndex, {}) as IDataObject;

    // Check if flag exists (could be undefined)
    if ('answered' in emailFlagsObj) {
      searchObject.answered = emailFlagsObj['answered'] as boolean;
    }
    if ('deleted' in emailFlagsObj) {
      searchObject.deleted = emailFlagsObj['deleted'] as boolean;
    }
    if ('draft' in emailFlagsObj) {
      searchObject.draft = emailFlagsObj['draft'] as boolean;
    }
    if ('flagged' in emailFlagsObj) {
      searchObject.flagged = emailFlagsObj['flagged'] as boolean;
    }
    if ('recent' in emailFlagsObj) {
      const recent = emailFlagsObj['recent'] as boolean;
      if (recent) {
        searchObject.recent = true;
      } else {
        searchObject.old = true;
      }
    }
    if ('seen' in emailFlagsObj && !showUnreadOnly) {
      searchObject.seen = emailFlagsObj['seen'] as boolean;
    }

    // Search filters processing (fallback to collection parameters)
    const emailSearchFiltersObj = context.getNodeParameter('emailSearchFilters', itemIndex, {}) as IDataObject;

    if ('bcc' in emailSearchFiltersObj) {
      searchObject.bcc = emailSearchFiltersObj['bcc'] as string;
    }
    if ('cc' in emailSearchFiltersObj) {
      searchObject.cc = emailSearchFiltersObj['cc'] as string;
    }
    // Use collection parameters as fallback if direct parameters not provided
    if ('from' in emailSearchFiltersObj && !searchObject.from) {
      searchObject.from = emailSearchFiltersObj['from'] as string;
    }
    if ('subject' in emailSearchFiltersObj && !searchObject.subject) {
      searchObject.subject = emailSearchFiltersObj['subject'] as string;
    }
    if ('text' in emailSearchFiltersObj && !searchObject.body) {
      searchObject.body = emailSearchFiltersObj['text'] as string;
    }
    if ('to' in emailSearchFiltersObj && !searchObject.to) {
      searchObject.to = emailSearchFiltersObj['to'] as string;
    }
    if ('uid' in emailSearchFiltersObj) {
      searchObject.uid = emailSearchFiltersObj['uid'] as string;
    }
  }

  return searchObject;
}

/**
 * Validates email search parameters
 */
export function validateEmailSearchParameters(searchObject: SearchObject): boolean {
  // Basic validation - can be extended
  if (searchObject.since && searchObject.before && searchObject.since > searchObject.before) {
    return false;
  }
  return true;
}
