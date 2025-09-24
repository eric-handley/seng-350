## Access

Swagger UI is available at `http://localhost:3000/api-docs` when the server is running.

## Core Decorators

### Controller-Level Decorators

```typescript
@ApiTags('Users')
@Controller('users')
export class UserController {
  // Routes go here
}
```

### Route-Level Decorators

```typescript
@ApiOperation({ summary: 'Brief description of what this endpoint does' })
@ApiResponse({ status: 200, description: 'Success response description' })
@ApiResponse({ status: 400, description: 'Bad request description' })
```

## HTTP Verb Examples

### GET Requests

#### Simple GET
```typescript
@Get()
@ApiOperation({ summary: 'Get all users' })
@ApiResponse({ status: 200, description: 'List of users returned successfully' })
async getAllUsers() {
  return this.userService.findAll();
}
```

#### GET with Path Parameter
```typescript
@Get(':id')
@ApiOperation({ summary: 'Get user by ID' })
@ApiParam({ name: 'id', description: 'User ID', type: 'string' })
@ApiResponse({ status: 200, description: 'User found' })
@ApiResponse({ status: 404, description: 'User not found' })
async getUserById(@Param('id') id: string) {
  return this.userService.findById(id);
}
```

#### GET with Query Parameters
```typescript
@Get()
@ApiOperation({ summary: 'Get users with filtering' })
@ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
@ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page' })
@ApiQuery({ name: 'status', required: false, enum: ['active', 'inactive'] })
@ApiResponse({ status: 200, description: 'Filtered users returned' })
async getUsers(
  @Query('page') page?: number,
  @Query('limit') limit?: number,
  @Query('status') status?: string
) {
  return this.userService.findWithFilters({ page, limit, status });
}
```

### POST Requests

```typescript
@Post()
@ApiOperation({ summary: 'Create a new user' })
@ApiBody({ type: CreateUserDto, description: 'User creation data' })
@ApiResponse({ status: 201, description: 'User created successfully' })
@ApiResponse({ status: 400, description: 'Invalid input data' })
@ApiResponse({ status: 409, description: 'User already exists' })
async createUser(@Body() createUserDto: CreateUserDto) {
  return this.userService.create(createUserDto);
}
```

### PUT Requests

```typescript
@Put(':id')
@ApiOperation({ summary: 'Update user completely' })
@ApiParam({ name: 'id', description: 'User ID to update' })
@ApiBody({ type: UpdateUserDto, description: 'Complete user data' })
@ApiResponse({ status: 200, description: 'User updated successfully' })
@ApiResponse({ status: 404, description: 'User not found' })
@ApiResponse({ status: 400, description: 'Invalid input data' })
async updateUser(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
  return this.userService.update(id, updateUserDto);
}
```

### PATCH Requests

```typescript
@Patch(':id')
@ApiOperation({ summary: 'Partially update user' })
@ApiParam({ name: 'id', description: 'User ID to update' })
@ApiBody({ type: PartialUpdateUserDto, description: 'Partial user data' })
@ApiResponse({ status: 200, description: 'User partially updated' })
@ApiResponse({ status: 404, description: 'User not found' })
async patchUser(@Param('id') id: string, @Body() patchData: PartialUpdateUserDto) {
  return this.userService.partialUpdate(id, patchData);
}
```

### DELETE Requests

```typescript
@Delete(':id')
@ApiOperation({ summary: 'Delete user' })
@ApiParam({ name: 'id', description: 'User ID to delete' })
@ApiResponse({ status: 200, description: 'User deleted successfully' })
@ApiResponse({ status: 404, description: 'User not found' })
@ApiResponse({ status: 403, description: 'Insufficient permissions' })
async deleteUser(@Param('id') id: string) {
  return this.userService.delete(id);
}
```

### HEAD Requests

```typescript
@Head(':id')
@ApiOperation({ summary: 'Check if user exists' })
@ApiParam({ name: 'id', description: 'User ID to check' })
@ApiResponse({ status: 200, description: 'User exists' })
@ApiResponse({ status: 404, description: 'User not found' })
async checkUserExists(@Param('id') id: string) {
  const exists = await this.userService.exists(id);
  if (!exists) {
    throw new NotFoundException();
  }
}
```

### OPTIONS Requests

```typescript
@Options()
@ApiOperation({ summary: 'Get allowed HTTP methods' })
@ApiResponse({ status: 200, description: 'Returns allowed methods' })
async getOptions() {
  return {
    allow: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']
  };
}
```

## Advanced Features

### Authentication
```typescript
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Get('protected')
@ApiOperation({ summary: 'Protected endpoint' })
@ApiResponse({ status: 401, description: 'Unauthorized' })
async getProtectedData() {
  return { data: 'sensitive information' };
}
```

### File Uploads
```typescript
@Post('upload')
@UseInterceptors(FileInterceptor('file'))
@ApiOperation({ summary: 'Upload a file' })
@ApiConsumes('multipart/form-data')
@ApiBody({
  schema: {
    type: 'object',
    properties: {
      file: {
        type: 'string',
        format: 'binary',
      },
    },
  },
})
async uploadFile(@UploadedFile() file: Express.Multer.File) {
  return { filename: file.filename };
}
```

### Custom Response Types
```typescript
@Get(':id')
@ApiOperation({ summary: 'Get user details' })
@ApiResponse({
  status: 200,
  description: 'User details',
  schema: {
    type: 'object',
    properties: {
      id: { type: 'string' },
      name: { type: 'string' },
      email: { type: 'string', format: 'email' },
      createdAt: { type: 'string', format: 'date-time' }
    }
  }
})
async getUserDetails(@Param('id') id: string) {
  return this.userService.findById(id);
}
```