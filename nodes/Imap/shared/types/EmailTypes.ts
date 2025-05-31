import { SearchObject } from 'imapflow';
import { IDataObject } from 'n8n-workflow';

/**
 * Email search filter types for type safety
 */
export interface EmailSearchFilters {
  from?: string;
  to?: string;
  subject?: string;
  text?: string;
  cc?: string;
  bcc?: string;
  uid?: string;
}

/**
 * Email date range filter
 */
export interface EmailDateRange {
  since?: string;
  before?: string;
}

/**
 * Email flags filter configuration
 */
export interface EmailFlagsFilter {
  answered?: boolean;
  deleted?: boolean;
  draft?: boolean;
  flagged?: boolean;
  recent?: boolean;
  seen?: boolean;
}

/**
 * Complete email search configuration
 */
export interface EmailSearchConfig {
  dateRange?: EmailDateRange;
  flags?: EmailFlagsFilter;
  filters?: EmailSearchFilters;
  includeParts?: string[];
  includeAllHeaders?: boolean;
  headersToInclude?: string;
}
