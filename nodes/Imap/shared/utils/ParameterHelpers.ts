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

  // Date range processing
  const emailDateRangeObj = context.getNodeParameter('emailDateRange', itemIndex) as IDataObject;
  const since = emailDateRangeObj['since'] as string;
  const before = emailDateRangeObj['before'] as string;

  if (since) {
    searchObject.since = new Date(since);
  }
  if (before) {
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

  // Search filters processing
  const emailSearchFiltersObj = context.getNodeParameter('emailSearchFilters', itemIndex) as IDataObject;

  if ('bcc' in emailSearchFiltersObj) {
    searchObject.bcc = emailSearchFiltersObj['bcc'] as string;
  }
  if ('cc' in emailSearchFiltersObj) {
    searchObject.cc = emailSearchFiltersObj['cc'] as string;
  }
  if ('from' in emailSearchFiltersObj) {
    searchObject.from = emailSearchFiltersObj['from'] as string;
  }
  if ('subject' in emailSearchFiltersObj) {
    searchObject.subject = emailSearchFiltersObj['subject'] as string;
  }
  if ('text' in emailSearchFiltersObj) {
    searchObject.body = emailSearchFiltersObj['text'] as string;
  }
  if ('to' in emailSearchFiltersObj) {
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
