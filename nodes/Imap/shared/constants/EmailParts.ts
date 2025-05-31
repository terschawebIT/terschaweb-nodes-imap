/**
 * Email content parts that can be included in responses
 */
export enum EmailParts {
  BodyStructure = 'bodyStructure',
  Flags = 'flags',
  Size = 'size',
  AttachmentsInfo = 'attachmentsInfo',
  TextContent = 'textContent',
  HtmlContent = 'htmlContent',
  Headers = 'headers',
}

/**
 * User-friendly descriptions for email parts
 */
export const EmailPartsDescriptions = {
  [EmailParts.TextContent]: 'Include the plain text content of emails - ideal for reading and analysis',
  [EmailParts.HtmlContent]: 'Include the HTML formatted content - useful for preserving formatting',
  [EmailParts.AttachmentsInfo]: 'Include information about attachments (filenames, sizes) - useful for file processing',
  [EmailParts.Flags]: 'Include email status flags (read/unread, flagged, etc.) - useful for status analysis',
  [EmailParts.Size]: 'Include email size in bytes - useful for storage analysis',
  [EmailParts.BodyStructure]: 'Include technical email structure - useful for advanced processing',
  [EmailParts.Headers]: 'Include email headers - useful for routing, security, and technical analysis',
} as const;
