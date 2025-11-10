#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { exec } from 'child_process';
import { promisify } from 'util';
import { readFile, writeFile, readdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { parseISO, getTime } from 'date-fns';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, '../../..');
const API_BASE = 'http://localhost:3000';

// Type definitions
interface Room {
  room_id: string;
  building_short_name: string;
  room_number: string;
  capacity: number;
  room_type: string;
}

interface Slot {
  start_time: string;
  end_time: string;
}

interface RoomWithSlots {
  room_id: string;
  slots?: Slot[];
}

interface Building {
  rooms?: RoomWithSlots[];
}

interface Schedule {
  buildings?: Building[];
}

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
      {
        name: 'list_rooms',
        description: 'List available rooms, optionally filtered by building',
        inputSchema: {
          type: 'object',
          properties: {
            building: {
              type: 'string',
              description: 'Optional building short name to filter rooms (e.g., "ECS", "CLE")',
            },
          },
        },
      },
      {
        name: 'check_room_availability',
        description: 'Check if a room is available for a specific time slot',
        inputSchema: {
          type: 'object',
          properties: {
            room_id: {
              type: 'string',
              description: 'Room ID (e.g., "ECS-124")',
            },
            date: {
              type: 'string',
              description: 'Date in YYYY-MM-DD format',
            },
            start_time: {
              type: 'string',
              description: 'Start time in HH:MM format (24-hour)',
            },
            end_time: {
              type: 'string',
              description: 'End time in HH:MM format (24-hour)',
            },
          },
          required: ['room_id', 'date', 'start_time', 'end_time'],
        },
      },
      {
        name: 'create_booking',
        description: 'Create a room booking. Requires authentication via login first.',
        inputSchema: {
          type: 'object',
          properties: {
            room_id: {
              type: 'string',
              description: 'Room ID (e.g., "ECS-124")',
            },
            date: {
              type: 'string',
              description: 'Date in YYYY-MM-DD format',
            },
            start_time: {
              type: 'string',
              description: 'Start time in HH:MM format (24-hour)',
            },
            end_time: {
              type: 'string',
              description: 'End time in HH:MM format (24-hour)',
            },
            email: {
              type: 'string',
              description: 'User email for authentication',
            },
            password: {
              type: 'string',
              description: 'User password for authentication',
            },
          },
          required: ['room_id', 'date', 'start_time', 'end_time', 'email', 'password'],
        },
      },
      {
        name: 'cancel_booking',
        description: 'Cancel an existing room booking. Staff can only cancel their own bookings. Requires authentication.',
        inputSchema: {
          type: 'object',
          properties: {
            booking_id: {
              type: 'string',
              description: 'Booking ID (UUID) to cancel',
            },
            email: {
              type: 'string',
              description: 'User email for authentication',
            },
            password: {
              type: 'string',
              description: 'User password for authentication',
            },
          },
          required: ['booking_id', 'email', 'password'],
        },
      },
    ],
  };
});

// Type guards for argument validation
function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (!args || !isObject(args)) {
    return {
      content: [
        {
          type: 'text',
          text: 'Error: Invalid arguments provided',
        },
      ],
      isError: true,
    };
  }

  try {
    switch (name) {
      case 'execute_task': {
        const task = isString(args.task) ? args.task : '';
        return {
          content: [
            {
              type: 'text',
              text: `Task execution initiated for: ${task}\n\nThis tool would analyze the codebase, break down the task into steps, and execute them. The actual implementation would integrate with an AI model to plan and execute the task automatically.`,
            },
          ],
        };
      }

      case 'read_file': {
        if (!isString(args.path)) {
          throw new Error('Path must be a string');
        }
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
        if (!isString(args.path)) {
          throw new Error('Path must be a string');
        }
        if (!isString(args.content)) {
          throw new Error('Content must be a string');
        }
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
        if (!isString(args.command)) {
          throw new Error('Command must be a string');
        }
        const cwd = isString(args.cwd) ? join(PROJECT_ROOT, args.cwd) : PROJECT_ROOT;
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
        if (!isString(args.query)) {
          throw new Error('Query must be a string');
        }
        // Simple grep-based search
        const filePattern = isString(args.file_pattern) ? args.file_pattern : undefined;
        const grepCommand = filePattern
          ? `grep -r "${args.query}" --include="${filePattern}" .`
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
        } catch {
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
        if (!isString(args.path)) {
          throw new Error('Path must be a string');
        }
        const dirPath = join(PROJECT_ROOT, args.path);
        const recursive = typeof args.recursive === 'boolean' ? args.recursive : false;
        const entries = await readdir(dirPath, { recursive });
        return {
          content: [
            {
              type: 'text',
              text: entries.join('\n'),
            },
          ],
        };
      }

      case 'list_rooms': {
        const building = isString(args.building) ? args.building : undefined;
        const params = building ? `?building_short_name=${encodeURIComponent(building)}` : '';
        const url = `${API_BASE}/rooms${params}`;
        
        try {
          const response = await fetch(url, {
            method: 'GET',
            headers: { 'Accept': 'application/json' },
          });
          
          if (!response.ok) {
            throw new Error(`Failed to fetch rooms: ${response.status} ${response.statusText}`);
          }
          
          const rooms = await response.json() as Room[];
          const formatted = rooms.map((r: Room) =>
            `${r.room_id} - ${r.building_short_name} ${r.room_number} (Capacity: ${r.capacity}, Type: ${r.room_type})`
          ).join('\n');
          
          return {
            content: [
              {
                type: 'text',
                text: formatted ?? 'No rooms found',
              },
            ],
          };
        } catch (error: unknown) {
          return {
            content: [
              {
                type: 'text',
                text: `Error fetching rooms: ${error instanceof Error ? error.message : 'Unknown error'}`,
              },
            ],
            isError: true,
          };
        }
      }

      case 'check_room_availability': {
        if (!isString(args.room_id) || !isString(args.date) || !isString(args.start_time) || !isString(args.end_time)) {
          throw new Error('All parameters (room_id, date, start_time, end_time) must be strings');
        }

        // Convert time format from HH:MM to HH-MM-SS for API
        const toApiTime = (time: string) => {
          const parts = time.split(':');
          const h = parts[0]?.padStart(2, '0') || '00';
          const m = parts[1]?.padStart(2, '0') || '00';
          return `${h}-${m}-00`;
        };

        const startApi = toApiTime(args.start_time);
        const endApi = toApiTime(args.end_time);
        const params = new URLSearchParams({
          room_id: args.room_id,
          date: args.date,
          start_time: startApi,
          end_time: endApi,
          slot_type: 'available',
        });

        try {
          const response = await fetch(`${API_BASE}/schedule?${params.toString()}`, {
            method: 'GET',
            headers: { 'Accept': 'application/json' },
          });

          if (!response.ok) {
            throw new Error(`Failed to check availability: ${response.status} ${response.statusText}`);
          }

          const schedule = await response.json() as Schedule;

          // Find the room in the schedule
          let roomInfo: RoomWithSlots | null = null;
          for (const building of schedule.buildings ?? []) {
            for (const room of building.rooms ?? []) {
              if (room.room_id === args.room_id) {
                roomInfo = room;
                break;
              }
            }
            if (roomInfo) {break;}
          }

          if (!roomInfo) {
            return {
              content: [
                {
                  type: 'text',
                  text: `Room ${args.room_id} not found or not available for the requested time slot.`,
                },
              ],
            };
          }

          const requestedStart = `${args.date}T${args.start_time}:00Z`;
          const requestedEnd = `${args.date}T${args.end_time}:00Z`;

          // Check if the requested time slot is in the available slots
          const isAvailable = roomInfo.slots?.some((slot: Slot) => {
            const slotStart = getTime(parseISO(slot.start_time));
            const slotEnd = getTime(parseISO(slot.end_time));
            const reqStart = getTime(parseISO(requestedStart));
            const reqEnd = getTime(parseISO(requestedEnd));
            return reqStart >= slotStart && reqEnd <= slotEnd;
          });

          if (isAvailable) {
            return {
              content: [
                {
                  type: 'text',
                  text: `Room ${args.room_id} is AVAILABLE from ${args.start_time} to ${args.end_time} on ${args.date}.`,
                },
              ],
            };
          } else {
            return {
              content: [
                {
                  type: 'text',
                  text: `Room ${args.room_id} is NOT AVAILABLE from ${args.start_time} to ${args.end_time} on ${args.date}.`,
                },
              ],
            };
          }
        } catch (error: unknown) {
          return {
            content: [
              {
                type: 'text',
                text: `Error checking availability: ${error instanceof Error ? error.message : 'Unknown error'}`,
              },
            ],
            isError: true,
          };
        }
      }

      case 'create_booking': {
        if (!isString(args.room_id) || !isString(args.date) || !isString(args.start_time) || !isString(args.end_time) || !isString(args.email) || !isString(args.password)) {
          throw new Error('All parameters are required');
        }

        // Convert time format from HH:MM to ISO 8601
        const toIsoDateTime = (date: string, time: string) => {
          const parts = time.split(':');
          const h = parts[0]?.padStart(2, '0') || '00';
          const m = parts[1]?.padStart(2, '0') || '00';
          return `${date}T${h}:${m}:00Z`;
        };

        const startIso = toIsoDateTime(args.date, args.start_time);
        const endIso = toIsoDateTime(args.date, args.end_time);

        try {
          // First, login to get session cookie
          const loginResponse = await fetch(`${API_BASE}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              email: args.email,
              password: args.password,
            }),
          });

          if (!loginResponse.ok) {
            const errorData = await loginResponse.json().catch(() => ({ message: 'Login failed' }));
            throw new Error(`Authentication failed: ${errorData.message ?? loginResponse.statusText}`);
          }

          // Extract all cookies from login response and parse them
          const setCookieHeader = loginResponse.headers.get('set-cookie');
          let cookieHeader = '';
          
          if (setCookieHeader) {
            // Parse the set-cookie header - it may contain multiple cookies
            const cookies = setCookieHeader.split(',').map(c => {
              // Extract the cookie name and value (before the first semicolon)
              const parts = c.trim().split(';');
              return parts[0];
            });
            cookieHeader = cookies.join('; ');
          }

          // Now create the booking with the session cookie
          const bookingResponse = await fetch(`${API_BASE}/bookings`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              ...(cookieHeader ? { 'Cookie': cookieHeader } : {}),
            },
            credentials: 'include',
            body: JSON.stringify({
              room_id: args.room_id,
              start_time: startIso,
              end_time: endIso,
            }),
          });

          if (!bookingResponse.ok) {
            const errorData = await bookingResponse.json().catch(() => ({ message: 'Booking failed' }));
            throw new Error(`Booking failed: ${errorData.message ?? bookingResponse.statusText}`);
          }

          const booking = await bookingResponse.json();
          
          return {
            content: [
              {
                type: 'text',
                text: `Successfully booked room ${args.room_id} from ${args.start_time} to ${args.end_time} on ${args.date}.\nBooking ID: ${booking.id}`,
              },
            ],
          };
        } catch (error: unknown) {
          return {
            content: [
              {
                type: 'text',
                text: `Error creating booking: ${error instanceof Error ? error.message : 'Unknown error'}`,
              },
            ],
            isError: true,
          };
        }
      }

      case 'cancel_booking': {
        if (!isString(args.booking_id) || !isString(args.email) || !isString(args.password)) {
          throw new Error('All parameters (booking_id, email, password) are required');
        }

        try {
          // First, login to get session cookie
          const loginResponse = await fetch(`${API_BASE}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              email: args.email,
              password: args.password,
            }),
          });

          if (!loginResponse.ok) {
            const errorData = await loginResponse.json().catch(() => ({ message: 'Login failed' }));
            throw new Error(`Authentication failed: ${errorData.message ?? loginResponse.statusText}`);
          }

          // Extract all cookies from login response and parse them
          const setCookieHeader = loginResponse.headers.get('set-cookie');
          let cookieHeader = '';
          
          if (setCookieHeader) {
            // Parse the set-cookie header - it may contain multiple cookies
            const cookies = setCookieHeader.split(',').map(c => {
              // Extract the cookie name and value (before the first semicolon)
              const parts = c.trim().split(';');
              return parts[0];
            });
            cookieHeader = cookies.join('; ');
          }

          // Now cancel the booking with the session cookie
          const cancelResponse = await fetch(`${API_BASE}/bookings/${encodeURIComponent(args.booking_id)}`, {
            method: 'DELETE',
            headers: {
              'Accept': 'application/json',
              ...(cookieHeader ? { 'Cookie': cookieHeader } : {}),
            },
            credentials: 'include',
          });

          if (!cancelResponse.ok) {
            // Handle different error scenarios
            if (cancelResponse.status === 404) {
              throw new Error(`Booking ${args.booking_id} not found`);
            } else if (cancelResponse.status === 403) {
              throw new Error(`You can only cancel your own bookings`);
            } else {
              const errorData = await cancelResponse.json().catch(() => ({ message: 'Cancellation failed' }));
              throw new Error(`Cancellation failed: ${errorData.message ?? cancelResponse.statusText}`);
            }
          }

          // 204 No Content on success, or 200 with body
          return {
            content: [
              {
                type: 'text',
                text: `Successfully cancelled booking ${args.booking_id}.`,
              },
            ],
          };
        } catch (error: unknown) {
          return {
            content: [
              {
                type: 'text',
                text: `Error cancelling booking: ${error instanceof Error ? error.message : 'Unknown error'}`,
              },
            ],
            isError: true,
          };
        }
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error: unknown) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
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

