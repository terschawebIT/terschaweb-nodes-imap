import { FetchQueryObject, ImapFlow } from "imapflow";
import { Readable } from "stream";
import { IExecuteFunctions, INodeExecutionData } from "n8n-workflow";
import { IResourceOperationDef } from "../../../utils/CommonDefinitions";
import { getMailboxPathFromNodeParameter, parameterSelectMailbox } from "../../../utils/SearchFieldParameters";
import { getEmailSearchParametersFromNode } from "../../../shared/utils/ParameterHelpers";
import { simpleParser } from 'mailparser';
import { getEmailPartsInfoRecursive } from "../../../utils/EmailParts";
import { streamToString } from "../../../shared/utils/StreamHelpers";
import { EmailParts } from "../../../shared/constants/EmailParts";

export const getEmailsListOperation: IResourceOperationDef = {
  operation: {
    name: 'Get Many',
    value: 'getEmailsList',
    description: 'Retrieve emails from an IMAP mailbox with advanced search and filtering capabilities. Perfect for AI agents to find specific emails, analyze content, or process email data automatically.',
  },
  parameters: [
    {
      ...parameterSelectMailbox,
      description: 'Select the mailbox to search for emails. AI agents can specify: INBOX, Sent, Drafts, or custom folder names.',
    },
    {
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
    },
    {
      displayName: "Email Flags Filter",
      name: "emailFlags",
      type: "collection",
      placeholder: "Add Flag Filter",
      default: {},
      description: "Filter emails by their status flags. AI can specify: 'unread emails', 'flagged emails', 'draft emails', etc.",
      options: [
        {
          displayName: "Is Answered",
          name: "answered",
          type: "boolean",
          default: false,
          description: "Whether emails have been replied to",
        },
        {
          displayName: "Is Deleted",
          name: "deleted",
          type: "boolean",
          default: false,
          description: "Whether emails are marked for deletion",
        },
        {
          displayName: "Is Draft",
          name: "draft",
          type: "boolean",
          default: false,
          description: "Whether emails are drafts (unsent emails)",
        },
        {
          displayName: "Is Flagged",
          name: "flagged",
          type: "boolean",
          default: false,
          description: "Whether emails are important/flagged",
        },
        {
          displayName: 'Is Read/Unread',
          name: "seen",
          type: "boolean",
          default: false,
          description: "Whether emails are read (true) or unread (false)",
        },
        {
          displayName: "Is Recent",
          name: "recent",
          type: "boolean",
          default: false,
          description: "Whether emails are recently received",
        },
      ],
    },
    {
      displayName: "Email Search Filters",
      name: "emailSearchFilters",
      type: "collection",
      placeholder: "Add Search Filter",
      default: {},
      description: "Advanced search filters for finding specific emails. AI can intelligently populate these based on natural language requests.",
      options: [
        {
          displayName: "BCC Email Address",
          name: "bcc",
          type: "string",
          default: "={{ $fromAI('bcc_email', 'Email address in BCC field') }}",
          description: "Email address or name in BCC field",
          placeholder: "admin@company.com",
        },
        {
          displayName: "CC Email Address",
          name: "cc",
          type: "string",
          default: "={{ $fromAI('cc_email', 'Email address in CC field') }}",
          description: "Email address or name in CC field",
          placeholder: "manager@company.com",
        },
        {
          displayName: "Email Content Contains",
          name: "text",
          type: "string",
          default: "={{ $fromAI('content_keywords', 'Keywords to search in email body content') }}",
          description: "Search for specific text in email body content",
          placeholder: "password reset, order confirmation, delivery",
        },
        {
          displayName: "From Email Address",
          name: "from",
          type: "string",
          default: "={{ $fromAI('sender_email', 'Email address of the sender to search for') }}",
          description: "Email address or name of the sender",
          placeholder: "john@example.com or John Doe",
        },
        {
          displayName: "Specific Email UIDs",
          name: "uid",
          type: "string",
          default: "={{ $fromAI('email_uids', 'Comma-separated list of specific email UIDs to retrieve') }}",
          description: 'Comma-separated list of specific email UIDs',
          placeholder: '1,2,3,15,42',
        },
        {
          displayName: "Subject Contains",
          name: "subject",
          type: "string",
          default: "={{ $fromAI('subject_keywords', 'Keywords to search in email subject line') }}",
          description: "Search for specific text in email subject line",
          placeholder: "invoice, meeting, urgent, project update",
        },
        {
          displayName: "To Email Address",
          name: "to",
          type: "string",
          default: "={{ $fromAI('recipient_email', 'Email address of the recipient to search for') }}",
          description: "Email address or name of the recipient",
          placeholder: "support@company.com or Support Team",
        },
      ],
    },
    {
      displayName: 'Email Content to Include',
      name: 'includeParts',
      type: 'multiOptions',
      placeholder: 'Select Content Types',
      default: [],
      description: 'Select which parts of the email to include in the response. AI agents can choose based on their specific needs.',
      options: [
        {
          name: 'Text Content (Plain Text)',
          value: EmailParts.TextContent,
          description: 'Include the plain text content - ideal for reading and analysis',
        },
        {
          name: 'HTML Content',
          value: EmailParts.HtmlContent,
          description: 'Include HTML formatted content - useful for preserving formatting',
        },
        {
          name: 'Attachments Info',
          value: EmailParts.AttachmentsInfo,
          description: 'Include attachment information - useful for file processing',
        },
        {
          name: 'Email Flags',
          value: EmailParts.Flags,
          description: 'Include email status flags - useful for status analysis',
        },
        {
          name: 'Email Size',
          value: EmailParts.Size,
          description: 'Include email size in bytes - useful for storage analysis',
        },
        {
          name: 'Email Structure',
          value: EmailParts.BodyStructure,
          description: 'Include technical email structure - useful for advanced processing',
        },
        {
          name: 'Email Headers',
          value: EmailParts.Headers,
          description: 'Include email headers - useful for routing and technical analysis',
        },
      ],
    },
    {
      displayName: 'Include All Headers',
      name: 'includeAllHeaders',
      type: 'boolean',
      default: true,
      description: 'Whether to include all email headers or only specific ones',
      displayOptions: {
        show: {
          includeParts: [EmailParts.Headers],
        },
      },
    },
    {
      displayName: 'Headers to Include',
      name: 'headersToInclude',
      type: 'string',
      default: "={{ $fromAI('email_headers', 'Comma-separated list of specific email headers to include for analysis') }}",
      description: 'Comma-separated list of specific email headers to include',
      placeholder: 'received,authentication-results,return-path,date,message-ID',
      displayOptions: {
        show: {
          includeParts: [EmailParts.Headers],
          includeAllHeaders: [false],
        },
      },
    },
    {
      displayName: 'Maximum Results',
      name: 'maxResults',
      type: 'number',
      default: 10,
      description: 'Maximum number of emails to return. AI agents should use small numbers for "latest" searches (10-50) to avoid data overload.',
      placeholder: '10',
      typeOptions: {
        minValue: 1,
        maxValue: 1000,
      },
    },
    // Direct AI Agent Parameters (for easier AI usage)
    {
      displayName: 'From Email Address (AI Direct)',
      name: 'From_Email_Address',
      type: 'string',
      default: "={{ $fromAI('from_email', 'Email address of the sender to search for') }}",
      description: 'Direct AI parameter for sender email address',
      placeholder: 'sender@domain.com',
    },
    {
      displayName: 'Subject Contains (AI Direct)',
      name: 'Subject_Contains',
      type: 'string',
      default: "={{ $fromAI('subject_contains', 'Keywords to search in email subject') }}",
      description: 'Direct AI parameter for subject keywords',
      placeholder: 'meeting, urgent, invoice',
    },
    {
      displayName: 'Email Content Contains (AI Direct)',
      name: 'Email_Content_Contains',
      type: 'string',
      default: "={{ $fromAI('content_contains', 'Keywords to search in email content') }}",
      description: 'Direct AI parameter for content keywords',
      placeholder: 'password, confirmation, delivery',
    },
    {
      displayName: 'To Email Address (AI Direct)',
      name: 'To_Email_Address',
      type: 'string',
      default: "={{ $fromAI('to_email', 'Email address of the recipient to search for') }}",
      description: 'Direct AI parameter for recipient email address',
      placeholder: 'recipient@domain.com',
    },
    {
      displayName: 'Since Date (AI Direct)',
      name: 'Since_Date',
      type: 'string',
      default: "={{ $fromAI('since_date', 'Start date for email search (YYYY-MM-DD format)') }}",
      description: 'Direct AI parameter for start date',
      placeholder: '2025-01-01',
    },
    {
      displayName: 'Before Date (AI Direct)',
      name: 'Before_Date',
      type: 'string',
      default: "={{ $fromAI('before_date', 'End date for email search (YYYY-MM-DD format)') }}",
      description: 'Direct AI parameter for end date',
      placeholder: '2025-12-31',
    },
    {
      displayName: 'Include All Headers (AI Direct)',
      name: 'Include_All_Headers',
      type: 'boolean',
      default: false,
      description: 'Whether to include all email headers in the response',
    },
    {
      displayName: 'Maximum Results (AI Direct)',
      name: 'Maximum_Results',
      type: 'number',
      default: 10,
      description: 'Direct AI parameter for limiting results',
      placeholder: '10',
      typeOptions: {
        minValue: 1,
        maxValue: 1000,
      },
    }
  ],
  async executeImapAction(context: IExecuteFunctions, itemIndex: number, client: ImapFlow): Promise<INodeExecutionData[] | null> {
    var returnData: INodeExecutionData[] = [];

    const mailboxPath = getMailboxPathFromNodeParameter(context, itemIndex);

    context.logger?.info(`Getting emails list from ${mailboxPath}`);

    await client.mailboxOpen(mailboxPath);

    var searchObject = getEmailSearchParametersFromNode(context, itemIndex);

    const includeParts = context.getNodeParameter('includeParts', itemIndex) as string[];
    var fetchQuery : FetchQueryObject = {
      uid: true,
      envelope: true,
    };

    if (includeParts.includes(EmailParts.BodyStructure)) {
      fetchQuery.bodyStructure = true;
    }
    if (includeParts.includes(EmailParts.Flags)) {
      fetchQuery.flags = true;
    }
    if (includeParts.includes(EmailParts.Size)) {
      fetchQuery.size = true;
    }
    if (includeParts.includes(EmailParts.Headers)) {
      fetchQuery.headers = true;
      // check if user wants only specific headers
      const includeAllHeaders = context.getNodeParameter('includeAllHeaders', itemIndex) as boolean;
      if (!includeAllHeaders) {
        const headersToInclude = context.getNodeParameter('headersToInclude', itemIndex) as string;
        context.logger?.info(`Including headers: ${headersToInclude}`);
        if (headersToInclude) {
          fetchQuery.headers = headersToInclude.split(',').map((header) => header.trim());
          context.logger?.info(`Including headers: ${fetchQuery.headers}`);
        }
      }
    }

    // will parse the bodystructure to get the attachments info
    const includeAttachmentsInfo = includeParts.includes(EmailParts.AttachmentsInfo);
    if (includeAttachmentsInfo) {
      fetchQuery.bodyStructure = true;
    }
    // text Content and html Content
    const includeTextContent = includeParts.includes(EmailParts.TextContent);
    const includeHtmlContent = includeParts.includes(EmailParts.HtmlContent);
    if (includeTextContent || includeHtmlContent) {
      // will parse the bodystructure to get the parts IDs for text and html
      fetchQuery.bodyStructure = true;
    }

    // log searchObject and fetchQuery
    context.logger?.debug(`Search object: ${JSON.stringify(searchObject)}`);
    context.logger?.debug(`Fetch query: ${JSON.stringify(fetchQuery)}`);

    // Get maxResults parameter for limiting results (try direct AI parameter first)
    let maxResults = context.getNodeParameter('Maximum_Results', itemIndex, 0, { extractValue: true }) as number;
    if (!maxResults || maxResults === 0) {
      maxResults = context.getNodeParameter('maxResults', itemIndex) as number;
    }
    context.logger?.info(`Limiting results to ${maxResults} emails`);

    // wait for all emails to be fetched before processing them
    // because we might need to fetch the body parts for each email,
    // and this will freeze the client if we do it in parallel
    const emailsList = [];
    let emailCount = 0;
    for  await (let email of client.fetch(searchObject, fetchQuery)) {
      emailsList.push(email);
      emailCount++;

      // Stop when we reach the limit
      if (emailCount >= maxResults) {
        context.logger?.info(`Reached maximum results limit of ${maxResults}, stopping fetch`);
        break;
      }
    }
    context.logger?.info(`Found ${emailsList.length} emails (limited to ${maxResults})`);

    // process the emails
    for (const email of emailsList) {
      context.logger?.info(`  ${email.uid}`);
      var item_json = JSON.parse(JSON.stringify(email));

      // add mailbox path to the item
      item_json.mailboxPath = mailboxPath;

      // process the headers
      if (includeParts.includes(EmailParts.Headers)) {
        if (email.headers) {
          try {
            const headersString = email.headers.toString();
            const parsed = await simpleParser(headersString);
            item_json.headers = {};
            parsed.headers.forEach((value, key, map) => {
              //context.logger?.info(`    HEADER [${key}] = ${value}`);
              item_json.headers[key] = value;
            });
          } catch (error) {
            context.logger?.error(`    Error parsing headers: ${error}`);
          }
        }
      }


      const analyzeBodyStructure = includeAttachmentsInfo || includeTextContent || includeHtmlContent;

      var textPartId = null;
      var htmlPartId = null;
      var attachmentsInfo = [];


      if (analyzeBodyStructure) {
        // workaround: dispositionParameters is an object, but it is not typed as such
        const bodyStructure = email.bodyStructure as unknown as any;

        if (bodyStructure) {
          // check if multipart
          if (bodyStructure.childNodes) {
            // get the parts info (could be recursive)
            var partsInfo = getEmailPartsInfoRecursive(context, bodyStructure);
            for (const partInfo of partsInfo) {
              if (partInfo.disposition === 'attachment') {
                attachmentsInfo.push({
                  partId: partInfo.partId,
                  filename: partInfo.filename,
                  type: partInfo.type,
                  encoding: partInfo.encoding,
                  size: partInfo.size,
                });
              } else {
                if (partInfo.type === 'text/plain') {
                  textPartId = partInfo.partId;
                }
                if (partInfo.type === 'text/html') {
                  htmlPartId = partInfo.partId;
                }
              }
            }
          } else {
            // single part, use "TEXT" as part ID
            if (bodyStructure.type === 'text/plain') {
              textPartId = "TEXT";
            }
            if (bodyStructure.type === 'text/html') {
              htmlPartId = "TEXT";
            }
          }
        }
      }

      if (includeAttachmentsInfo) {
        item_json.attachmentsInfo = attachmentsInfo;
      }

      // fetch text and html content
      if (includeTextContent || includeHtmlContent) {
        if (includeTextContent) {
          // always set textContent to null, in case there is no text part
          item_json.textContent = null;
          if (textPartId) {
            const textContent = await client.download(email.uid.toString(), textPartId, {
              uid: true,
            });
            if (textContent.content) {
              item_json.textContent = await streamToString(textContent.content);
            }
          }
        }
        if (includeHtmlContent) {
          // always set htmlContent to null, in case there is no html part
          item_json.htmlContent = null;
          if (htmlPartId) {
            const htmlContent = await client.download(email.uid.toString(), htmlPartId, {
              uid: true,
            });
            if (htmlContent.content) {
              item_json.htmlContent = await streamToString(htmlContent.content);
            }
          }
        }
      }

      returnData.push({
        json: item_json,
      });
    }

    return returnData;
  },
};
