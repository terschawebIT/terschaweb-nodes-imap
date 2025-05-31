import { SearchObject } from "imapflow";
import { IDataObject, IExecuteFunctions } from "n8n-workflow";

/**
 * Parameter processing utilities for email operations
 */

/**
 * Extracts email search parameters from node context and converts to IMAP SearchObject
 */
export function getEmailSearchParametersFromNode(context: IExecuteFunctions, itemIndex: number): SearchObject {
  var searchObject: SearchObject = {};

  // First try direct AI parameters (for AI Agent usage)
  const fromEmailDirect = context.getNodeParameter('From_Email_Address', itemIndex, '', { extractValue: true }) as string;
  const subjectDirect = context.getNodeParameter('Subject_Contains', itemIndex, '', { extractValue: true }) as string;
  const contentDirect = context.getNodeParameter('Email_Content_Contains', itemIndex, '', { extractValue: true }) as string;
  const toEmailDirect = context.getNodeParameter('To_Email_Address', itemIndex, '', { extractValue: true }) as string;
  const sinceDateDirect = context.getNodeParameter('Since_Date', itemIndex, '', { extractValue: true }) as string;
  const beforeDateDirect = context.getNodeParameter('Before_Date', itemIndex, '', { extractValue: true }) as string;

  // Use direct AI parameters if provided
  if (fromEmailDirect && fromEmailDirect.trim() !== '') {
    searchObject.from = fromEmailDirect;
  }
  if (subjectDirect && subjectDirect.trim() !== '') {
    searchObject.subject = subjectDirect;
  }
  if (contentDirect && contentDirect.trim() !== '') {
    searchObject.body = contentDirect;
  }
  if (toEmailDirect && toEmailDirect.trim() !== '') {
    searchObject.to = toEmailDirect;
  }
  if (sinceDateDirect && sinceDateDirect.trim() !== '') {
    searchObject.since = new Date(sinceDateDirect);
  }
  if (beforeDateDirect && beforeDateDirect.trim() !== '') {
    searchObject.before = new Date(beforeDateDirect);
  }

  // Date range processing (fallback to collection parameters)
  const emailDateRangeObj = context.getNodeParameter('emailDateRange', itemIndex) as IDataObject;
  const since = emailDateRangeObj['since'] as string;
  const before = emailDateRangeObj['before'] as string;

  if (since && !searchObject.since) {
    searchObject.since = new Date(since);
  }
  if (before && !searchObject.before) {
    searchObject.before = new Date(before);
  }

  // Email flags processing
  const emailFlagsObj = context.getNodeParameter('emailFlags', itemIndex) as IDataObject;

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
  if ('seen' in emailFlagsObj) {
    searchObject.seen = emailFlagsObj['seen'] as boolean;
  }

  // Search filters processing (fallback to collection parameters)
  const emailSearchFiltersObj = context.getNodeParameter('emailSearchFilters', itemIndex) as IDataObject;

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
