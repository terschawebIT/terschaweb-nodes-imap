// Entry point for n8n-nodes-imap-ai package
// This file is required by n8n to load the community package

module.exports = {
  description: {
    displayName: 'IMAP AI',
    name: 'n8n-nodes-imap-ai',
    version: '1.1.24',
    description: 'AI-Agent ready IMAP node for n8n with enhanced $fromAI() integration and AI Tool support. Complete email and mailbox management with intelligent automation capabilities.',
    author: 'Niko Terschawetz <niko.terschawetz@terschaweb.de>',
    homepage: 'https://github.com/terschawebIT/terschaweb-nodes-imap',
    license: 'MIT',
    credentials: [
      'dist/credentials/ImapCredentials.credentials.js'
    ],
    nodes: [
      'dist/nodes/Imap/Imap.node.js',
      'dist/nodes/EmailSearchAI/EmailSearchAI.node.js'
    ]
  }
};
