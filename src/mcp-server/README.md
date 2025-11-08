# UVic Booking MCP Server

This is a Model Context Protocol (MCP) server that provides tools for interacting with the UVic Room Booking System codebase.

## Setup

1. Install dependencies:
```bash
cd src/mcp-server
npm install
```

2. Build the server:
```bash
npm run build
```

3. Start the server:
```bash
npm start
```

## Configuration

To use this MCP server with Cursor or Claude Desktop, add the following configuration:

### For Cursor (.cursor/mcp-config.json):
```json
{
  "mcpServers": {
    "uvic-booking": {
      "command": "node",
      "args": ["src/mcp-server/dist/index.js"],
      "cwd": "${workspaceFolder}"
    }
  }
}
```

### For Claude Desktop:
Edit `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or equivalent config file:

```json
{
  "mcpServers": {
    "uvic-booking": {
      "command": "node",
      "args": ["/absolute/path/to/project/src/mcp-server/dist/index.js"]
    }
  }
}
```

## Available Tools

### execute_task
Execute a high-level task by breaking it down into steps. This is the main tool for task completion.

**Example:**
```
"Please add input validation to the booking form"
```

### read_file
Read a file from the codebase.

**Example:**
```
Read src/client/src/pages/BookingPage.tsx
```

### write_file
Write content to a file.

**Example:**
```
Write to src/client/src/config.ts with content: "export const API_URL = ..."
```

### run_command
Execute a shell command in the project directory.

**Example:**
```
Run: npm run lint
```

### search_codebase
Search the codebase for patterns or code.

**Example:**
```
Search for: "hardcoded API URL"
```

### list_files
List files in a directory.

**Example:**
```
List files in src/server/src/api
```

### list_rooms
List available rooms in the system, optionally filtered by building.

**Example:**
```
List rooms in building "ECS"
```

### check_room_availability
Check if a room is available for a specific time slot.

**Example:**
```
Check if room "ECS-124" is available on 2025-10-05 from 10:00 to 11:00
```

### create_booking
Create a room booking. Authenticates the user and creates the booking.

**Example:**
```
Book room "ECS-124" on 2025-10-05 from 10:00 to 11:00 with email "staff@uvic.ca" and password "staff"
```

### cancel_booking
Cancel an existing room booking. Staff can only cancel their own bookings. Requires authentication.

**Example:**
```
Cancel booking "555ca47f-a1a7-4c32-80da-62545a9e07dc" using email "staff@uvic.ca" and password "staff"
```

**Note:** The server must be running at `http://localhost:3000` for booking tools to work.

## Usage

Once configured, users can interact with the MCP server through Cursor or Claude Desktop. The agent will automatically use these tools to complete tasks.

**Example prompts:**
- "Please fix all hardcoded configuration values"
- "Please add unit tests for the bookings service"
- "Please update the module diagram to match the codebase"
- "List all available rooms in the ECS building"
- "Book room ECS-124 for tomorrow from 2pm to 3pm"
- "Cancel booking 555ca47f-a1a7-4c32-80da-62545a9e07dc"

The MCP server will break down these tasks and execute them using the available tools.

## Booking Tools

The MCP server includes specialized tools for interacting with the UVic Room Booking System:

- **list_rooms**: Query available rooms by building
- **check_room_availability**: Verify if a room is free for a time slot
- **create_booking**: Create a booking (requires authentication)
- **cancel_booking**: Cancel an existing booking (staff can only cancel their own)

These tools connect to the booking API running at `http://localhost:3000`. Make sure the server is running before using booking tools.

**Test Users:**
- `staff@uvic.ca` / `staff`
- `registrar@uvic.ca` / `registrar`
- `admin@uvic.ca` / `admin`

