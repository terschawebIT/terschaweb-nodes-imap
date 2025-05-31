import { Readable } from "stream";

/**
 * Stream processing utilities for email operations
 */

/**
 * Converts a readable stream to string
 */
export function streamToString(stream: Readable): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!stream) {
      resolve('');
    } else {
      const chunks: any[] = [];
      stream.on('data', (chunk: any) => {
        chunks.push(chunk);
      });
      stream.on('end', () => {
        resolve(Buffer.concat(chunks).toString('utf8'));
      });
      stream.on('error', reject);
    }
  });
}
