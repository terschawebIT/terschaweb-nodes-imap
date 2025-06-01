// Entry point for n8n-nodes-imap-ai package
// This file is required by n8n to load the community package

module.exports = {
  description: {
    displayName: 'IMAP AI Nodes',
    name: 'n8n-nodes-imap-ai',
    description: 'AI-Agent ready IMAP nodes for n8n with enhanced email management capabilities',
    version: '1.1.18',
    nodes: [
      'dist/nodes/Imap/Imap.node.js',
      'dist/nodes/EmailSearchAI/EmailSearchAi.node.js'
    ],
    credentials: [
      'dist/credentials/ImapCredentials.credentials.js'
    ]
  }
};
