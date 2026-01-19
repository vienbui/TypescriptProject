import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import { URL } from 'url';
import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

interface QuipResponse {
  thread: {
    id: string;
    title: string;
    link: string;
    created_usec: number;
    updated_usec: number;
  };
}

interface UploadOptions {
  filePath: string;
  title?: string;
  folderId?: string;
}

/**
 * Converts a Markdown file to a Quip document using the Quip API
 */
async function uploadMarkdownToQuip(options: UploadOptions): Promise<QuipResponse> {
  const { filePath, title, folderId } = options;

  // Get Quip API token from environment
  const quipToken = process.env.QUIP_ACCESS_TOKEN;
  if (!quipToken) {
    throw new Error(
      'QUIP_ACCESS_TOKEN environment variable is not set.\n' +
      'Get your token from: https://quip.com/dev/token'
    );
  }

  // Read the markdown file
  const absolutePath = path.resolve(filePath);
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`File not found: ${absolutePath}`);
  }

  const markdownContent = fs.readFileSync(absolutePath, 'utf-8');
  
  // Check file size (Quip limit is 1MB)
  const contentSize = Buffer.byteLength(markdownContent, 'utf-8');
  if (contentSize > 1024 * 1024) {
    throw new Error(`File size exceeds 1MB limit. Current size: ${(contentSize / 1024 / 1024).toFixed(2)}MB`);
  }

  // Determine title: use provided title, or extract from first heading, or use filename
  let documentTitle = title;
  if (!documentTitle) {
    // Try to extract title from first markdown heading
    const headingMatch = markdownContent.match(/^#\s+(.+)$/m);
    if (headingMatch) {
      documentTitle = headingMatch[1].trim();
    } else {
      // Use filename without extension
      documentTitle = path.basename(filePath, path.extname(filePath));
    }
  }

  // Prepare form data
  const formData = new URLSearchParams();
  formData.append('content', markdownContent);
  formData.append('format', 'markdown');
  formData.append('title', documentTitle);
  
  if (folderId) {
    formData.append('member_ids', folderId);
  }

  // Make the API request
  return new Promise((resolve, reject) => {
    const url = new URL('https://platform.quip.com/1/threads/new-document');
    
    const requestOptions: https.RequestOptions = {
      hostname: url.hostname,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${quipToken}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(formData.toString()),
      },
    };

    const req = https.request(requestOptions, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const response = JSON.parse(data) as QuipResponse;
            resolve(response);
          } catch (e) {
            reject(new Error(`Failed to parse response: ${data}`));
          }
        } else {
          reject(new Error(`API request failed with status ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(new Error(`Request failed: ${error.message}`));
    });

    req.write(formData.toString());
    req.end();
  });
}

function printUsage(): void {
  console.log(`
Usage: npx ts-node scripts/md-to-quip.ts <markdown-file> [options]

Arguments:
  <markdown-file>     Path to the markdown file to convert

Options:
  --title, -t         Document title (defaults to first heading or filename)
  --folder, -f        Quip folder ID to place the document in
  --help, -h          Show this help message

Environment Variables:
  QUIP_ACCESS_TOKEN   Your Quip API access token (required)
                      Get it from: https://quip.com/dev/token

Examples:
  # Basic usage
  npx ts-node scripts/md-to-quip.ts README.md

  # With custom title
  npx ts-node scripts/md-to-quip.ts docs/spec.md --title "API Specification"

  # With folder ID
  npx ts-node scripts/md-to-quip.ts DESIGN_DOC.md --folder "AbCdEfGhIj"

  # Using environment variable inline
  QUIP_ACCESS_TOKEN=your_token npx ts-node scripts/md-to-quip.ts README.md
`);
}

function parseArgs(args: string[]): { filePath?: string; title?: string; folderId?: string; help: boolean } {
  const result: { filePath?: string; title?: string; folderId?: string; help: boolean } = { help: false };
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--help' || arg === '-h') {
      result.help = true;
    } else if (arg === '--title' || arg === '-t') {
      result.title = args[++i];
    } else if (arg === '--folder' || arg === '-f') {
      result.folderId = args[++i];
    } else if (!arg.startsWith('-')) {
      result.filePath = arg;
    }
  }
  
  return result;
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const parsedArgs = parseArgs(args);

  if (parsedArgs.help) {
    printUsage();
    process.exit(0);
  }

  if (!parsedArgs.filePath) {
    console.error('Error: No markdown file specified\n');
    printUsage();
    process.exit(1);
  }

  try {
    console.log(`Uploading ${parsedArgs.filePath} to Quip...`);
    
    const response = await uploadMarkdownToQuip({
      filePath: parsedArgs.filePath,
      title: parsedArgs.title,
      folderId: parsedArgs.folderId,
    });

    console.log('\n✓ Document created successfully!\n');
    console.log(`  Title: ${response.thread.title}`);
    console.log(`  URL:   ${response.thread.link}`);
    console.log(`  ID:    ${response.thread.id}`);
  } catch (error) {
    console.error(`\n✗ Error: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

main();
