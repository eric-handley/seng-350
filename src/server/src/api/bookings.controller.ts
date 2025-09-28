import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ValidationPipe,
  ParseUUIDPipe,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { BookingsService } from '../services/bookings.service';
import { CreateBookingDto, UpdateBookingDto, BookingResponseDto } from '../dto/booking.dto';

@ApiTags('Bookings')
@Controller('bookings')
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
    @Query('userId', ParseUUIDPipe) userId: string,
  ): Promise<BookingResponseDto> {
    return this.bookingsService.create(createBookingDto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get bookings with optional filters' })
  @ApiQuery({ name: 'userId', required: false, description: 'Filter by user ID' })
  @ApiQuery({ name: 'roomId', required: false, description: 'Filter by room ID' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Filter by start date (ISO 8601)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'Filter by end date (ISO 8601)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of bookings',
    type: [BookingResponseDto],
  })
  async findAll(
    @Query('userId') userId?: string,
    @Query('roomId') roomId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<BookingResponseDto[]> {
    const startDateObj = startDate ? new Date(startDate) : undefined;
    const endDateObj = endDate ? new Date(endDate) : undefined;
    
    return this.bookingsService.findAll(userId, roomId, startDateObj, endDateObj);
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
  @ApiQuery({ name: 'userId', required: false, description: 'User ID for ownership validation' })
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
    status: HttpStatus.CONFLICT,
    description: 'Room conflict or unauthorized access',
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateBookingDto: UpdateBookingDto,
    @Query('userId') userId?: string,
  ): Promise<BookingResponseDto> {
    return this.bookingsService.update(id, updateBookingDto, userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Cancel booking by ID' })
  @ApiParam({ name: 'id', description: 'Booking UUID' })
  @ApiQuery({ name: 'userId', required: false, description: 'User ID for ownership validation' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Booking cancelled successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Booking not found',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Unauthorized to cancel this booking',
  })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('userId') userId?: string,
  ): Promise<void> {
    return this.bookingsService.remove(id, userId);
  }
}