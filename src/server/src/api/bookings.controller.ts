import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseUUIDPipe,
  HttpStatus,
  HttpCode,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { BookingsService } from '../services/bookings.service';
import { CreateBookingDto, UpdateBookingDto, BookingResponseDto } from '../dto/booking.dto';
import { AuthenticatedGuard } from '../shared/guards/authenticated.guard';
import { CurrentUser } from '../shared/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/auth.service';

@ApiTags('Bookings')
@ApiBearerAuth()
@Controller('bookings')
@UseGuards(AuthenticatedGuard)
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new booking' })
  @ApiBody({ type: CreateBookingDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Booking created successfully',
    type: BookingResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Room is already booked for this time slot',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Room or user not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid booking data (e.g., start time after end time)',
  })
  async create(
    @Body() createBookingDto: CreateBookingDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<BookingResponseDto> {
    return this.bookingsService.create(createBookingDto, user);
  }

  @Get()
  @ApiOperation({ summary: 'Get bookings with optional filters (Staff: own bookings, Admin: any user)' })
  @ApiQuery({ name: 'userId', required: false, description: 'Filter by user ID (Admin only)' })
  @ApiQuery({ name: 'roomId', required: false, description: 'Filter by room ID' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Filter by start date (ISO 8601)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'Filter by end date (ISO 8601)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of bookings',
    type: [BookingResponseDto],
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Cannot view other users bookings (non-Admin)',
  })
  async findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query('userId') userId?: string,
    @Query('roomId') roomId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<BookingResponseDto[]> {
    const startDateObj = startDate ? new Date(startDate) : undefined;
    const endDateObj = endDate ? new Date(endDate) : undefined;

    return this.bookingsService.findAll(user, userId, roomId, startDateObj, endDateObj);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get booking by ID' })
  @ApiParam({ name: 'id', description: 'Booking UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Booking found',
    type: BookingResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Booking not found',
  })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<BookingResponseDto> {
    return this.bookingsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update booking by ID' })
  @ApiParam({ name: 'id', description: 'Booking UUID' })
  @ApiBody({ type: UpdateBookingDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Booking updated successfully',
    type: BookingResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Booking not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'You can only update your own bookings',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Room conflict',
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateBookingDto: UpdateBookingDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<BookingResponseDto> {
    return this.bookingsService.update(id, updateBookingDto, user);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Cancel booking by ID' })
  @ApiParam({ name: 'id', description: 'Booking UUID' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Booking cancelled successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Booking not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'You can only cancel your own bookings',
  })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<void> {
    return this.bookingsService.remove(id, user);
  }
}