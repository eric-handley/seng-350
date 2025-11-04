#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { exec } from 'child_process';
import { promisify } from 'util';
import { readFile, writeFile, readdir, stat } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, '../../..');

// Initialize the server
const server = new Server(
  {
    name: 'uvic-booking-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'execute_task',
        description: 'Execute a high-level task by breaking it down into steps and executing them. The agent will analyze the codebase, plan the implementation, and make the necessary changes.',
        inputSchema: {
          type: 'object',
          properties: {
            task: {
              type: 'string',
              description: 'The task description in natural language (e.g., "Add input validation to the booking form", "Fix all hardcoded API URLs")',
            },
            context: {
              type: 'string',
              description: 'Additional context, requirements, or constraints for the task',
            },
            files: {
              type: 'array',
              items: { type: 'string' },
              description: 'Optional list of specific files to reference or modify',
            },
          },
          required: ['task'],
        },
      },
      {
        name: 'read_file',
        description: 'Read a file from the codebase',
        inputSchema: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: 'Relative path to the file from project root',
            },
          },
          required: ['path'],
        },
      },
      {
        name: 'write_file',
        description: 'Write content to a file',
        inputSchema: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: 'Relative path to the file from project root',
            },
            content: {
              type: 'string',
              description: 'File content to write',
            },
          },
          required: ['path', 'content'],
        },
      },
      {
        name: 'run_command',
        description: 'Execute a shell command in the project directory',
        inputSchema: {
          type: 'object',
          properties: {
            command: {
              type: 'string',
              description: 'Shell command to execute',
            },
            cwd: {
              type: 'string',
              description: 'Working directory (defaults to project root)',
            },
          },
          required: ['command'],
        },
      },
      {
        name: 'search_codebase',
        description: 'Search the codebase for patterns, functions, or code',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search query describing what to find',
            },
            file_pattern: {
              type: 'string',
              description: 'Optional file pattern to limit search (e.g., "*.ts", "src/**/*.tsx")',
            },
          },
          required: ['query'],
        },
      },
      {
        name: 'list_files',
        description: 'List files in a directory',
        inputSchema: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: 'Directory path (relative to project root)',
            },
            recursive: {
              type: 'boolean',
              description: 'Whether to list files recursively',
            },
          },
          required: ['path'],
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'execute_task': {
        // This is a high-level task - the actual implementation would
        // use AI to break down the task and execute it
        return {
          content: [
            {
              type: 'text',
              text: `Task execution initiated for: ${args.task}\n\nThis tool would analyze the codebase, break down the task into steps, and execute them. The actual implementation would integrate with an AI model to plan and execute the task automatically.`,
            },
          ],
        };
      }

      case 'read_file': {
        const filePath = join(PROJECT_ROOT, args.path);
        const content = await readFile(filePath, 'utf-8');
        return {
          content: [
            {
              type: 'text',
              text: content,
            },
          ],
        };
      }

      case 'write_file': {
        const filePath = join(PROJECT_ROOT, args.path);
        await writeFile(filePath, args.content, 'utf-8');
        return {
          content: [
            {
              type: 'text',
              text: `Successfully wrote to ${args.path}`,
            },
          ],
        };
      }

      case 'run_command': {
        const cwd = args.cwd ? join(PROJECT_ROOT, args.cwd) : PROJECT_ROOT;
        const { stdout, stderr } = await execAsync(args.command, { cwd });
        return {
          content: [
            {
              type: 'text',
              text: stdout || stderr || 'Command executed successfully',
            },
          ],
        };
      }

      case 'search_codebase': {
        // Simple grep-based search
        const grepCommand = args.file_pattern
          ? `grep -r "${args.query}" --include="${args.file_pattern}" .`
          : `grep -r "${args.query}" .`;
        
        try {
          const { stdout } = await execAsync(grepCommand, { cwd: PROJECT_ROOT });
          return {
            content: [
              {
                type: 'text',
                text: stdout || 'No matches found',
              },
            ],
          };
        } catch (error: any) {
          // grep returns non-zero exit code when no matches found
          return {
            content: [
              {
                type: 'text',
                text: 'No matches found',
              },
            ],
          };
        }
      }

      case 'list_files': {
        const dirPath = join(PROJECT_ROOT, args.path);
        const entries = await readdir(dirPath, { recursive: args.recursive });
        return {
          content: [
            {
              type: 'text',
              text: entries.join('\n'),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error: any) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('UVic Booking MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

