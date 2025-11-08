import { Injectable, PipeTransform, BadRequestException } from '@nestjs/common';
import { parseISO, isValid } from 'date-fns';

/**
 * Pipe to transform ISO 8601 date strings to Date objects.
 * Used for query parameters that come in as strings but need to be Date objects.
 *
 * Example usage:
 * @Query('startDate', ParseDatePipe) startDate: Date
 */
@Injectable()
export class ParseDatePipe implements PipeTransform {
  transform(value: any): Date | undefined {
    if (!value) {
      return undefined;
    }

    // If already a Date object, return as-is
    if (value instanceof Date) {
      return value;
    }

    // If it's a string, parse it
    if (typeof value === 'string') {
      const date = parseISO(value);
      if (!isValid(date)) {
        throw new BadRequestException(`Invalid date format: ${value}. Expected ISO 8601 format.`);
      }
      return date;
    }

    throw new BadRequestException(`Invalid date type: expected string or Date, got ${typeof value}`);
  }
}
