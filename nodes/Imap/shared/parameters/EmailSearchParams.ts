import { INodeProperties } from 'n8n-workflow';
import { EmailFlags, EmailFlagsDescriptions } from '../constants/EmailFlags';
import { AIEmailSearchFilters } from './AIEnhancedParams';

/**
 * Modular email search parameters with AI enhancement
 */

/**
 * Date range search parameters
 */
export const emailDateRangeParams: INodeProperties = {
  displayName: "Date Range",
  name: "emailDateRange",
  type: "collection",
  placeholder: "Add Date Range",
  default: { since: "" },
  description: "Filter emails by date range. AI agents can specify dates like 'last week', 'yesterday', or specific dates.",
  options: [
    {
      displayName: "Since Date",
      name: "since",
      type: "dateTime",
      default: "",
      description: "Start date of search. AI can specify: 'yesterday', 'last week', '2024-01-01', etc.",
    },
    {
      displayName: "Before Date",
      name: "before",
      type: "dateTime",
      default: "",
      description: "End date of search. AI can specify: 'today', 'last month', '2024-12-31', etc.",
    },
  ],
};
