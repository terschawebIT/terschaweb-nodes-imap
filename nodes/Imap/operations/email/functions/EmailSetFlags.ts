import { ImapFlow } from "imapflow";
import { IExecuteFunctions, INodeExecutionData, NodeApiError } from "n8n-workflow";
import { IResourceOperationDef } from "../../../utils/CommonDefinitions";
import { getMailboxPathFromNodeParameter, parameterSelectMailbox } from '../../../utils/SearchFieldParameters';


enum ImapFlags {
  Answered = '\\Answered',
  Flagged = '\\Flagged',
  Deleted = '\\Deleted',
  Seen = '\\Seen',
  Draft = '\\Draft',
}

export const setEmailFlagsOperation: IResourceOperationDef = {
  operation: {
    name: 'Set Flags',
    value: 'setEmailFlags',
    description: 'Set or remove email flags like "Read/Unread", "Flagged", "Answered" etc. Perfect for AI agents to organize emails, mark as read, flag important messages, or manage email status automatically.',
  },
  parameters: [
    {
      ...parameterSelectMailbox,
      description: 'Select the mailbox containing the emails to modify. AI agents can specify: INBOX, Sent, Drafts, or custom folder names.',
    },
    {
      displayName: 'Email UID',
      name: 'emailUid',
      type: 'string',
      default: "={{ $fromAI('email_uid', 'UID of the email or comma-separated list of email UIDs to modify flags for') }}",
      description: 'UID of the email to set flags on. AI can specify single UID or comma-separated list for bulk operations.',
      placeholder: '123 or 123,456,789',
      hint: 'You can use comma separated list of UIDs to modify multiple emails at once',
    },
    {
      displayName: 'Email Flags to Modify',
      name: 'flags',
      type: 'collection',
      default: {},
      required: true,
      placeholder: 'Add Flag to Modify',
      description: 'Choose which email flags to set or remove. AI agents can intelligently set these based on email processing needs.',
      options: [
        {
          displayName: 'Answered',
          name: ImapFlags.Answered,
          type: 'boolean',
          default: false,
          description: 'Whether email is marked as answered/replied to',
        },
        {
          displayName: 'Deleted',
          name: ImapFlags.Deleted,
          type: 'boolean',
          default: false,
          description: 'Whether email is marked for deletion',
        },
        {
          displayName: 'Draft',
          name: ImapFlags.Draft,
          type: 'boolean',
          default: false,
          description: 'Whether email is marked as draft',
        },
        {
          displayName: 'Flagged',
          name: ImapFlags.Flagged,
          type: 'boolean',
          default: false,
          description: 'Whether email is flagged as important',
        },
        {
          displayName: 'Seen',
          name: ImapFlags.Seen,
          type: 'boolean',
          default: false,
          description: 'Whether email is marked as read/seen',
        },
      ],
    },
  ],
  async executeImapAction(context: IExecuteFunctions, itemIndex: number, client: ImapFlow): Promise<INodeExecutionData[] | null> {
    var returnData: INodeExecutionData[] = [];

    const mailboxPath = getMailboxPathFromNodeParameter(context, itemIndex);
    const emailUid = context.getNodeParameter('emailUid', itemIndex) as string;
    const flags = context.getNodeParameter('flags', itemIndex) as unknown as { [key: string]: boolean };

    var flagsToSet : string[] = [];
    var flagsToRemove : string[] = [];
    for (const flagName in flags) {
        if (flags[flagName]) {
          flagsToSet.push(flagName);
        } else {
          flagsToRemove.push(flagName);
        }
    }

    context.logger?.info(`Setting flags "${flagsToSet.join(',')}" and removing flags "${flagsToRemove.join(',')}" on email "${emailUid}" in mailbox "${mailboxPath}"`);

    await client.mailboxOpen(mailboxPath, { readOnly: false });

    if (flagsToSet.length > 0) {
      const isSuccess : boolean = await client.messageFlagsAdd(emailUid, flagsToSet, {
        uid: true,
      });
      if (!isSuccess) {
        throw new NodeApiError(context.getNode(), {}, {
          message: `Unable to set flags ${flagsToSet.join(', ')} on email UID ${emailUid}`,
        });
      }
    }
    if (flagsToRemove.length > 0) {
      const isSuccess : boolean = await client.messageFlagsRemove(emailUid, flagsToRemove, {
        uid: true,
      });
      if (!isSuccess) {
        throw new NodeApiError(context.getNode(), {}, {
          message: `Unable to remove flags ${flagsToRemove.join(', ')} from email UID ${emailUid}`,
        });
      }
    }

    // Return success information
    returnData.push({
      json: {
        success: true,
        emailUid: emailUid,
        mailboxPath: mailboxPath,
        flagsSet: flagsToSet,
        flagsRemoved: flagsToRemove,
        totalFlags: flagsToSet.length + flagsToRemove.length,
        operation: 'setEmailFlags'
      },
    });

    return returnData;
  },
};
