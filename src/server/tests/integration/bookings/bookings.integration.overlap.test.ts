jest.setTimeout(30000);

import request from 'supertest';
import { BookingStatus } from '../../../src/database/entities/booking.entity';
import { setupBookingsIntegrationTest, BookingsTestContext, createTomorrow, setTime } from './bookings.integration.test-setup';

describe('Bookings Integration - Overlap Prevention', () => {
  let ctx: BookingsTestContext;

  beforeAll(async () => {
    ctx = await setupBookingsIntegrationTest();
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  beforeEach(async () => {
    // Clean up bookings before each test
    await ctx.bookingRepository.clear();
  });

  it('should prevent overlapping bookings via API-level conflict check', async () => {
    let tomorrow = createTomorrow();
    tomorrow = setTime(tomorrow, 9, 0);

    let endTime = new Date(tomorrow);
    endTime = setTime(endTime, 10, 0);

    // Create first booking
    await request(ctx.app.getHttpServer())
      .post('/bookings')
      .send({
        room_id: ctx.testRoom.room_id,
        start_time: tomorrow.toISOString(),
        end_time: endTime.toISOString(),
      })
      .set('X-Test-User-Id', ctx.staffUser.id)
      .expect(201);

    // Try to create overlapping booking
    const res = await request(ctx.app.getHttpServer())
      .post('/bookings')
      .send({
        room_id: ctx.testRoom.room_id,
        start_time: tomorrow.toISOString(),
        end_time: endTime.toISOString(),
      })
      .set('X-Test-User-Id', ctx.staffUser.id)
      .expect(409);

    expect(res.body.message).toContain('already booked');
  });

  it('should prevent partial overlaps (start during existing booking)', async () => {
    let tomorrow = createTomorrow();
    tomorrow = setTime(tomorrow, 9, 0);

    let endTime = new Date(tomorrow);
    endTime = setTime(endTime, 11, 0);

    await request(ctx.app.getHttpServer())
      .post('/bookings')
      .send({
        room_id: ctx.testRoom.room_id,
        start_time: tomorrow.toISOString(),
        end_time: endTime.toISOString(),
      })
      .set('X-Test-User-Id', ctx.staffUser.id)
      .expect(201);

    let overlapStart = new Date(tomorrow);
    overlapStart = setTime(overlapStart, 10);
    let overlapEnd = new Date(tomorrow);
    overlapEnd = setTime(overlapEnd, 12);

    const res = await request(ctx.app.getHttpServer())
      .post('/bookings')
      .send({
        room_id: ctx.testRoom.room_id,
        start_time: overlapStart.toISOString(),
        end_time: overlapEnd.toISOString(),
      })
      .set('X-Test-User-Id', ctx.staffUser.id)
      .expect(409);

    expect(res.body.message).toContain('already booked');
  });

  it('should prevent partial overlaps (end during existing booking)', async () => {
    let tomorrow = createTomorrow();
    tomorrow = setTime(tomorrow, 10, 0);

    let endTime = new Date(tomorrow);
    endTime = setTime(endTime, 12, 0);

    await request(ctx.app.getHttpServer())
      .post('/bookings')
      .send({
        room_id: ctx.testRoom.room_id,
        start_time: tomorrow.toISOString(),
        end_time: endTime.toISOString(),
      })
      .set('X-Test-User-Id', ctx.staffUser.id)
      .expect(201);

    let overlapStart = new Date(tomorrow);
    overlapStart = setTime(overlapStart, 9);
    let overlapEnd = new Date(tomorrow);
    overlapEnd = setTime(overlapEnd, 11);

    const res = await request(ctx.app.getHttpServer())
      .post('/bookings')
      .send({
        room_id: ctx.testRoom.room_id,
        start_time: overlapStart.toISOString(),
        end_time: overlapEnd.toISOString(),
      })
      .set('X-Test-User-Id', ctx.staffUser.id)
      .expect(409);

    expect(res.body.message).toContain('already booked');
  });

  it('should prevent bookings that completely contain an existing booking', async () => {
    let tomorrow = createTomorrow();
    tomorrow = setTime(tomorrow, 10, 0);

    let endTime = new Date(tomorrow);
    endTime = setTime(endTime, 11, 0);

    await request(ctx.app.getHttpServer())
      .post('/bookings')
      .send({
        room_id: ctx.testRoom.room_id,
        start_time: tomorrow.toISOString(),
        end_time: endTime.toISOString(),
      })
      .set('X-Test-User-Id', ctx.staffUser.id)
      .expect(201);

    let wrapStart = new Date(tomorrow);
    wrapStart = setTime(wrapStart, 9);
    let wrapEnd = new Date(tomorrow);
    wrapEnd = setTime(wrapEnd, 12);

    const res = await request(ctx.app.getHttpServer())
      .post('/bookings')
      .send({
        room_id: ctx.testRoom.room_id,
        start_time: wrapStart.toISOString(),
        end_time: wrapEnd.toISOString(),
      })
      .set('X-Test-User-Id', ctx.staffUser.id)
      .expect(409);

    expect(res.body.message).toContain('already booked');
  });

  it('should allow adjacent bookings (back-to-back)', async () => {
    let tomorrow = createTomorrow();
    tomorrow = setTime(tomorrow, 9, 0);

    let midTime = new Date(tomorrow);
    midTime = setTime(midTime, 10);

    let endTime = new Date(tomorrow);
    endTime = setTime(endTime, 11, 0);

    await request(ctx.app.getHttpServer())
      .post('/bookings')
      .send({
        room_id: ctx.testRoom.room_id,
        start_time: tomorrow.toISOString(),
        end_time: midTime.toISOString(),
      })
      .set('X-Test-User-Id', ctx.staffUser.id)
      .expect(201);

    await request(ctx.app.getHttpServer())
      .post('/bookings')
      .send({
        room_id: ctx.testRoom.room_id,
        start_time: midTime.toISOString(),
        end_time: endTime.toISOString(),
      })
      .set('X-Test-User-Id', ctx.staffUser.id)
      .expect(201);
  });

  it('should allow overlapping bookings in different rooms', async () => {
    const rooms = await ctx.roomRepository.find({ take: 2 });
    if (rooms.length < 2) {
      throw new Error('Need at least 2 rooms for this test');
    }

    let tomorrow = createTomorrow();
    tomorrow = setTime(tomorrow, 9, 0);

    let endTime = new Date(tomorrow);
    endTime = setTime(endTime, 10, 0);

    await request(ctx.app.getHttpServer())
      .post('/bookings')
      .send({
        room_id: rooms[0].room_id,
        start_time: tomorrow.toISOString(),
        end_time: endTime.toISOString(),
      })
      .set('X-Test-User-Id', ctx.staffUser.id)
      .expect(201);

    await request(ctx.app.getHttpServer())
      .post('/bookings')
      .send({
        room_id: rooms[1].room_id,
        start_time: tomorrow.toISOString(),
        end_time: endTime.toISOString(),
      })
      .set('X-Test-User-Id', ctx.staffUser.id)
      .expect(201);
  });

  it('should allow overlapping with cancelled bookings', async () => {
    let tomorrow = createTomorrow();
    tomorrow = setTime(tomorrow, 9, 0);

    let endTime = new Date(tomorrow);
    endTime = setTime(endTime, 10, 0);

    const createRes = await request(ctx.app.getHttpServer())
      .post('/bookings')
      .send({
        room_id: ctx.testRoom.room_id,
        start_time: tomorrow.toISOString(),
        end_time: endTime.toISOString(),
      })
      .set('X-Test-User-Id', ctx.staffUser.id)
      .expect(201);

    // Cancel the booking
    await request(ctx.app.getHttpServer())
      .delete(`/bookings/${createRes.body.id}`)
      .set('X-Test-User-Id', ctx.staffUser.id)
      .expect(204);

    // Should be able to book the same time slot
    await request(ctx.app.getHttpServer())
      .post('/bookings')
      .send({
        room_id: ctx.testRoom.room_id,
        start_time: tomorrow.toISOString(),
        end_time: endTime.toISOString(),
      })
      .set('X-Test-User-Id', ctx.staffUser.id)
      .expect(201);
  });

  it('should enforce overlap prevention at database level (exclusion constraint)', async () => {
    let tomorrow = createTomorrow();
    tomorrow = setTime(tomorrow, 9, 0);

    let endTime = new Date(tomorrow);
    endTime = setTime(endTime, 10, 0);

    await ctx.bookingRepository.save({
      user_id: ctx.staffUser.id,
      room_id: ctx.testRoom.room_id,
      start_time: tomorrow,
      end_time: endTime,
      status: BookingStatus.ACTIVE,
    });

    // Try to insert overlapping booking directly
    // Should throw an error due to the exclusion constraint
    await expect(
      ctx.bookingRepository.save({
        user_id: ctx.staffUser.id,
        room_id: ctx.testRoom.room_id,
        start_time: tomorrow,
        end_time: endTime,
        status: BookingStatus.ACTIVE,
      })
    ).rejects.toThrow(/violates exclusion constraint|no_overlapping_bookings/);
  });
});
