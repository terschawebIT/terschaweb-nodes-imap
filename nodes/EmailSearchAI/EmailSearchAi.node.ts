import { IExecuteFunctions, INodeExecutionData, INodeType, INodeTypeDescription, NodeConnectionType, ICredentialTestFunctions, INodeCredentialTestResult, ICredentialsDecrypted } from 'n8n-workflow';
import { ImapCredentialsData } from '../../credentials/ImapCredentials.credentials';
import { createImapClient } from '../Imap/utils/ImapUtils';
import { NodeApiError } from 'n8n-workflow';
import { getImapCredentials } from '../Imap/utils/CredentialsSelector';

export class EmailSearchAI implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'EmailSearchAI',
    name: 'emailSearchAi',
    icon: 'file:node-imap-icon.svg',
    group: ['main'],
    version: 1,
    subtitle: 'AI-optimized email search',
    description: 'Simple email search with minimal parameters - designed for AI agents',
    defaults: {
      name: 'EmailSearchAI',
    },
    inputs: [NodeConnectionType.Main],
    outputs: [NodeConnectionType.Main],
    usableAsTool: true,
    credentials: [
      {
        name: 'imapApi',
        required: true,
      },
    ],
    properties: [
      {
        displayName: 'From Email',
        name: 'from',
        type: 'string',
        default: '',
        description: 'Email address of the sender to search for',
      },
      {
        displayName: 'Subject Contains',
        name: 'subject',
        type: 'string',
        default: '',
        description: 'Keywords to search in email subject line',
      },
      {
        displayName: 'Max Results',
        name: 'max_results',
        type: 'number',
        default: 1,
        typeOptions: {
          minValue: 1,
          maxValue: 5,
        },
        description: 'Maximum number of emails to return (1-5)',
      },
    ],
  };

  methods = {
    credentialTest: {
      async testImapCredentials(this: ICredentialTestFunctions, credential: ICredentialsDecrypted): Promise<INodeCredentialTestResult> {
        try {
          const credentials = credential.data as unknown as ImapCredentialsData;
          const client = createImapClient(credentials, undefined, false);
          await client.connect();
          await client.logout();
        } catch (error) {
          return {
            status: 'Error',
            message: (error as Error).message,
          };
        }
        return {
          status: 'OK',
          message: 'Connection successful!',
        };
      },
    },
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];

    for (let i = 0; i < items.length; i++) {
      try {
        // Get parameters
        const from = this.getNodeParameter('from', i) as string;
        const subject = this.getNodeParameter('subject', i) as string;
        const maxResults = this.getNodeParameter('max_results', i) as number;

        // Get credentials
        const credentials = await getImapCredentials(this);

        // Create IMAP client
        const client = createImapClient(credentials, undefined, false);
        await client.connect();

        // Build search criteria
        const searchCriteria: any = {};

        if (from) {
          searchCriteria.from = from;
        }

        if (subject) {
          searchCriteria.subject = subject;
        }

        // Search emails in INBOX
        const lock = await client.getMailboxLock('INBOX');
        let emails: any[] = [];

        try {
          const messages = client.fetch(searchCriteria, {
            envelope: true,
            uid: true,
          });

          let count = 0;

          for await (const message of messages) {
            if (count >= maxResults) break;

            if (message.envelope) {
              emails.push({
                uid: message.uid,
                date: message.envelope.date?.toISOString().split('T')[0] || '',
                from: message.envelope.from?.[0]?.address || '',
                subject: message.envelope.subject || '',
              });
            }
            count++;
          }
        } finally {
          lock.release();
        }

        await client.logout();

        returnData.push({
          json: {
            emails,
            total: emails.length,
            search_criteria: {
              from: from || null,
              subject: subject || null,
              max_results: maxResults,
            }
          },
        });

      } catch (error) {
        if (this.continueOnFail()) {
          returnData.push({
            json: {
              error: (error as Error).message,
              emails: [],
              total: 0,
            },
          });
          continue;
        }
        throw new NodeApiError(this.getNode(), { message: (error as Error).message });
      }
    }

    return [returnData];
  }
}
