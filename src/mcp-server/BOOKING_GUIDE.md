# How to Use the MCP Server to Book a Room

This guide explains how to use the MCP server to book rooms through Cursor's AI assistant.

## Prerequisites

1. **Make sure the booking server is running:**
   ```bash
   # From the project root, start the server
   npm run tmux
   # Or if you prefer to run services separately:
   # Start the server at http://localhost:3000
   ```

2. **Ensure the MCP server is built:**
   ```bash
   cd src/mcp-server
   npm install
   npm run build
   ```

3. **Verify MCP configuration:**
   The MCP server should already be configured in `.cursor/mcp-config.json`. If not, see the README for setup instructions.

## Booking a Room

Once the MCP server is running and configured, you can book rooms using natural language prompts in Cursor. Here are several ways to do it:

### Method 1: Direct Natural Language Request

Simply ask Cursor to book a room:

```
Book room ECS-124 for tomorrow from 2pm to 3pm using email staff@uvic.ca and password staff
```

```
Create a booking for room CLE-A308 on 2025-10-05 from 10:00 to 11:00. Use staff@uvic.ca / staff
```

### Method 2: Step-by-Step Process

You can also break it down:

1. **First, list available rooms:**
   ```
   List all rooms in the ECS building
   ```

2. **Check availability:**
   ```
   Check if room ECS-124 is available on 2025-10-05 from 14:00 to 15:00
   ```

3. **Then book:**
   ```
   Book room ECS-124 on 2025-10-05 from 14:00 to 15:00 with credentials staff@uvic.ca / staff
   ```

## Available Test Users

- `staff@uvic.ca` / `staff` - Regular staff user
- `registrar@uvic.ca` / `registrar` - Registrar user
- `admin@uvic.ca` / `admin` - Admin user

## Date and Time Formats

- **Date:** Use `YYYY-MM-DD` format (e.g., `2025-10-05`)
- **Time:** Use 24-hour format `HH:MM` (e.g., `14:00` for 2pm, `09:30` for 9:30am)

## Example Prompts

### Simple Booking
```
Book room ECS-124 for today from 10am to 11am using staff@uvic.ca
```

### Booking with Availability Check First
```
First check if ECS-124 is available tomorrow from 2pm to 4pm, then book it if available
```

### Finding and Booking a Room
```
Show me all rooms in the CLE building, then book CLE-A308 for tomorrow from 10am to 12pm
```

### Multiple Bookings
```
Book room ECS-124 for Monday from 9am to 10am, and room CLE-A308 for Tuesday from 2pm to 3pm
```

## What Happens Behind the Scenes

When you request a booking, the MCP server:

1. **Authenticates** - Logs in with the provided credentials to get a session cookie
2. **Validates** - Checks that the room exists and the time slot is valid
3. **Books** - Creates the booking through the API
4. **Confirms** - Returns the booking ID and confirmation

## Troubleshooting

### "Server must be running" error
- Make sure the booking server is running at `http://localhost:3000`
- Check that the database is connected and populated

### "Authentication failed" error
- Verify you're using the correct email and password
- Check that the user exists in the database

### "Room not found" error
- Verify the room ID format (e.g., `ECS-124`, `CLE-A308`)
- Check that the room exists using `list_rooms`

### "Booking failed" error
- The room might already be booked for that time slot
- Check availability first using `check_room_availability`
- Verify the date/time format is correct

## Tips

- Use `list_rooms` to discover available rooms before booking
- Use `check_room_availability` to verify a time slot before booking
- The MCP server handles authentication automatically, so you don't need to manage sessions
- You can use relative dates like "tomorrow" or "Monday" - the AI will convert them to the proper format

