import { ICredentialTestFunctions, ICredentialsDecrypted, IExecuteFunctions, ILoadOptionsFunctions, INodeCredentialTestResult, INodeExecutionData, INodeType, INodeTypeDescription, NodeConnectionType } from 'n8n-workflow';
import { allResourceDefinitions } from './operations/ResourcesList';
import { getAllResourceNodeParameters } from './utils/CommonDefinitions';
import { ImapCredentialsData } from '../../credentials/ImapCredentials.credentials';
import { ImapFlowErrorCatcher, createImapClient } from './utils/ImapUtils';
import { NodeApiError } from 'n8n-workflow';
import { loadMailboxList } from './utils/SearchFieldParameters';
import { CREDENTIALS_TYPE_CORE_IMAP_ACCOUNT, CREDENTIALS_TYPE_THIS_NODE, credentialNames, getImapCredentials } from './utils/CredentialsSelector';


export class ImapTool implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'IMAP Tool',
    name: 'imapTool',
    icon: 'file:node-imap-icon.svg',
    group: ['transform'],
    version: 1,
    subtitle: '={{ $parameter["operation"] + ": " + $parameter["resource"] }}',
    description: 'Retrieve and manage emails via IMAP - AI Agent Tool Support',
    defaults: {
      name: 'IMAP Tool',
    },
    // eslint-disable-next-line n8n-nodes-base/node-class-description-inputs-wrong-regular-node
    inputs: [NodeConnectionType.Main],
    // eslint-disable-next-line n8n-nodes-base/node-class-description-outputs-wrong
    outputs: [NodeConnectionType.Main],
    // AI Tool-spezifische Eigenschaften
    usableAsTool: true,
    requestDefaults: {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    },
    credentials: [
      // using credentials from Core IMAP Trigger node
      {
        // eslint-disable-next-line n8n-nodes-base/node-class-description-credentials-name-unsuffixed
        name: credentialNames[CREDENTIALS_TYPE_CORE_IMAP_ACCOUNT],
        required: true,
        displayOptions: {
          show: {
            authentication: [
              CREDENTIALS_TYPE_CORE_IMAP_ACCOUNT,
            ],
          },
        },
      },
      // using credentials from this node
      {
        // eslint-disable-next-line n8n-nodes-base/node-class-description-credentials-name-unsuffixed
        name: credentialNames[CREDENTIALS_TYPE_THIS_NODE],
        required: true,
        displayOptions: {
          show: {
            authentication: [
              CREDENTIALS_TYPE_THIS_NODE,
            ],
          },
        },
      },
    ],
    properties: [
      // credential type
      {
        displayName: 'Credential Type',
        name: 'authentication',
        type: 'options',
        // eslint-disable-next-line n8n-nodes-base/node-param-default-wrong-for-options
        default: CREDENTIALS_TYPE_THIS_NODE,
        options: [
          {
            // eslint-disable-next-line n8n-nodes-base/node-param-display-name-miscased
            name: 'IMAP',
            value: CREDENTIALS_TYPE_THIS_NODE,
            description: 'Use credentials from this node',
          },
          {
            // eslint-disable-next-line n8n-nodes-base/node-param-display-name-miscased
            name: 'N8N IMAP Trigger Node',
            value: CREDENTIALS_TYPE_CORE_IMAP_ACCOUNT,
            description: 'Use existing credentials from N8N IMAP Trigger node',
          },
        ],
      },

      // eslint-disable-next-line n8n-nodes-base/node-param-default-missing
      {
        displayName: 'Resource',
        name: 'resource',
        type: 'options',
        noDataExpression: true,
        options: allResourceDefinitions.map((resourceDef) => resourceDef.resource),
        default: allResourceDefinitions[0].resource.value,
        description: 'The resource for this operation',
      },

      // combine all parameters from all operations
      ...allResourceDefinitions.map((resourceDef) => getAllResourceNodeParameters(resourceDef)).flat(),

    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][] > {
    const credentials = await getImapCredentials(this);

    // create imap client and connect
    const N8N_LOG_LEVEL = process.env.N8N_LOG_LEVEL || 'info';
    const ENABLE_DEBUG_LOGGING = (N8N_LOG_LEVEL === 'debug');
    const client = createImapClient(credentials, this.logger, ENABLE_DEBUG_LOGGING);

    try {
      await client.connect();
    } catch (error) {
      const errorMessage = (error as any)?.message || 'Connection failed';
      this.logger.error(`Connection failed: ${errorMessage}`);
      throw new NodeApiError(this.getNode(), {}, {
        message: (error as any)?.responseText || errorMessage || 'Unknown error',
      });
    }

    // try/catch to close connection in any case
    try {

      // get node parameters
      const FIRST_ITEM_INDEX = 0; // resource and operation are the same for all items
      const resource = this.getNodeParameter('resource', FIRST_ITEM_INDEX) as string;
      const operation = this.getNodeParameter('operation', FIRST_ITEM_INDEX) as string;

      var resultBranches: INodeExecutionData[][] = [];
      var resultItems: INodeExecutionData[] = [];
      resultBranches.push(resultItems);

      // run corresponding operation
      const handler = allResourceDefinitions.find((resourceDef) => resourceDef.resource.value === resource)?.operationDefs.find((operationDef) => operationDef.operation.value === operation);
      if (handler) {
        // running operation in a loop for each input item
        const items = this.getInputData();

        for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
          try {
            // some errors are not thrown but logged by ImapFlow internally, so we try to catch them
            ImapFlowErrorCatcher.getInstance().startErrorCatching();

            const result = await handler.executeImapAction(this, itemIndex, client);
            if (result) {
              resultItems.push(...result);
            } else {
              this.logger.warn(`Operation "${operation}" for resource "${resource}" returned no data`);
            }
          } catch (error) {
            const internalImapErrors = ImapFlowErrorCatcher.getInstance().stopAndGetErrors();
            const internalImapErrorsMessage = internalImapErrors.join(", \n");

            if (internalImapErrors.length > 0) {
              this.logger.error(`IMAP server reported errors: ${internalImapErrorsMessage}`);
            }

            if (error instanceof NodeApiError) {
              // don't include internal IMAP errors, because the error message is already composed by the handler
              throw error;
            }

            // seems to be unknown error, check IMAP internal errors and include them in the error message

            var errorMessage = (error as any)?.responseText || (error as any)?.message || undefined;
            if (!errorMessage) {
              if (internalImapErrorsMessage) {
                errorMessage = internalImapErrorsMessage;
              } else {
                errorMessage = 'Unknown error';
              }
            }
            this.logger.error(`Operation "${operation}" for resource "${resource}" failed: ${errorMessage}`);
            this.logger.error(JSON.stringify(error));
            var errorDetails : any = {
              message: errorMessage,
            };
            if (internalImapErrorsMessage) {
              errorDetails.description = "The following errors were reported by the IMAP server: \n" + internalImapErrorsMessage;
            }
            throw new NodeApiError(this.getNode(), {}, errorDetails);
          }
        }

      } else {
        this.logger.error(`Unknown operation "${operation}" for resource "${resource}"`);
        throw new NodeApiError(this.getNode(), {}, {
          message: `Unknown operation "${operation}" for resource "${resource}"`,
        });
      }

      return resultBranches;

    } finally {
      // close connection
      try {
        await client.logout();
      } catch (error) {
        this.logger.warn(`Error during logout: ${(error as any)?.message || error}`);
      }
    }
  }

  methods = {
    credentialTest: {
      async testImapCredentials(this: ICredentialTestFunctions, credential: ICredentialsDecrypted): Promise<INodeCredentialTestResult> {
        try {
          // create imap client and test connection
          const client = createImapClient(credential.data as unknown as ImapCredentialsData);
          await client.connect();
          await client.logout();

          return {
            status: 'OK',
            message: 'Connection successful',
          };
        } catch (error) {
          return {
            status: 'Error',
            message: (error as any)?.message || 'Unknown error',
          };
        }
      },
    },
    loadOptions: {
      async getMailboxes(this: ILoadOptionsFunctions): Promise<any> {
        return await loadMailboxList.call(this);
      },
    },
  };
}
