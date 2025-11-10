jest.setTimeout(30000);

import request from 'supertest';
import { addDays, addMonths, addHours } from 'date-fns';
import { setupBookingsIntegrationTest, BookingsTestContext, setTime } from './bookings.integration.test-setup';

describe('Bookings Integration - Validation Rules', () => {
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

  describe('Past Bookings', () => {
    it('should block STAFF from creating bookings in the past', async () => {
      const yesterday = setTime(addDays(new Date(), -1), 9);
      const endTime = setTime(yesterday, 10);

      const res = await request(ctx.app.getHttpServer())
        .post('/bookings')
        .send({
          room_id: ctx.testRoom.room_id,
          start_time: yesterday.toISOString(),
          end_time: endTime.toISOString(),
        })
        .set('X-Test-User-Id', ctx.staffUser.id)
        .expect(400);

      expect(res.body.message).toContain('past');
    });

    it('should allow ADMIN to create bookings in the past', async () => {
      const yesterday = setTime(addDays(new Date(), -1), 9);
      const endTime = setTime(yesterday, 10);

      await request(ctx.app.getHttpServer())
        .post('/bookings')
        .send({
          room_id: ctx.testRoom.room_id,
          start_time: yesterday.toISOString(),
          end_time: endTime.toISOString(),
        })
        .set('X-Test-User-Id', ctx.adminUser.id)
        .expect(201);
    });
  });

  describe('Duration Limits', () => {
    it('should reject bookings shorter than 15 minutes', async () => {
      let tomorrow = addDays(new Date(), 1);
      tomorrow = setTime(tomorrow, 9, 0);

      let endTime = new Date(tomorrow);
      endTime = setTime(endTime, 9, 10); // Only 10 minutes

      const res = await request(ctx.app.getHttpServer())
        .post('/bookings')
        .send({
          room_id: ctx.testRoom.room_id,
          start_time: tomorrow.toISOString(),
          end_time: endTime.toISOString(),
        })
        .set('X-Test-User-Id', ctx.staffUser.id)
        .expect(400);

      expect(res.body.message).toContain('15 minutes');
    });

    it('should accept bookings exactly 15 minutes long', async () => {
      let tomorrow = addDays(new Date(), 1);
      tomorrow = setTime(tomorrow, 9, 0);

      let endTime = new Date(tomorrow);
      endTime = setTime(endTime, 9, 15);

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

    it('should reject bookings longer than 8 hours', async () => {
      let tomorrow = addDays(new Date(), 1);
      tomorrow = setTime(tomorrow, 9, 0);

      let endTime = new Date(tomorrow);
      endTime = setTime(endTime, 18, 0); // 9 hours

      const res = await request(ctx.app.getHttpServer())
        .post('/bookings')
        .send({
          room_id: ctx.testRoom.room_id,
          start_time: tomorrow.toISOString(),
          end_time: endTime.toISOString(),
        })
        .set('X-Test-User-Id', ctx.staffUser.id)
        .expect(400);

      expect(res.body.message).toContain('8 hours');
    });

    it('should accept bookings exactly 8 hours long', async () => {
      let tomorrow = addDays(new Date(), 1);
      tomorrow = setTime(tomorrow, 9, 0);

      let endTime = new Date(tomorrow);
      endTime = setTime(endTime, 17, 0);

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
  });

  describe('Advance Booking Limits', () => {
    it('should block STAFF from booking more than 3 months in advance', async () => {
      const fourMonthsAhead = setTime(addMonths(new Date(), 4), 9);
      const endTime = setTime(fourMonthsAhead, 10);

      const res = await request(ctx.app.getHttpServer())
        .post('/bookings')
        .send({
          room_id: ctx.testRoom.room_id,
          start_time: fourMonthsAhead.toISOString(),
          end_time: endTime.toISOString(),
        })
        .set('X-Test-User-Id', ctx.staffUser.id)
        .expect(400);

      expect(res.body.message).toContain('3 months');
    });

    it('should allow STAFF to book exactly 3 months in advance', async () => {
      const threeMonthsAhead = setTime(addMonths(new Date(), 3), 9);
      const endTime = setTime(threeMonthsAhead, 10);

      await request(ctx.app.getHttpServer())
        .post('/bookings')
        .send({
          room_id: ctx.testRoom.room_id,
          start_time: threeMonthsAhead.toISOString(),
          end_time: endTime.toISOString(),
        })
        .set('X-Test-User-Id', ctx.staffUser.id)
        .expect(201);
    });

    it('should allow ADMIN to book more than 3 months in advance', async () => {
      const sixMonthsAhead = setTime(addMonths(new Date(), 6), 9);
      let endTime = setTime(sixMonthsAhead, 10);
      endTime = setTime(endTime, 10, 0);

      await request(ctx.app.getHttpServer())
        .post('/bookings')
        .send({
          room_id: ctx.testRoom.room_id,
          start_time: sixMonthsAhead.toISOString(),
          end_time: endTime.toISOString(),
        })
        .set('X-Test-User-Id', ctx.adminUser.id)
        .expect(201);
    });
  });

  describe('Post-Start Modifications', () => {
    it('should block STAFF from updating booking after start_time', async () => {
      const twoHoursAgo = addHours(new Date(), -2);
      const fourHoursLater = addHours(new Date(), 4);

      // Admin creates a booking that has started but not ended (duration: 6 hours)
      const createRes = await request(ctx.app.getHttpServer())
        .post('/bookings')
        .send({
          room_id: ctx.testRoom.room_id,
          start_time: twoHoursAgo.toISOString(),
          end_time: fourHoursLater.toISOString(),
        })
        .set('X-Test-User-Id', ctx.adminUser.id)
        .expect(201);

      // Transfer ownership to staff user
      await ctx.bookingRepository.update(createRes.body.id, { user_id: ctx.staffUser.id });

      // Staff tries to update
      const newEndTime = addHours(fourHoursLater, 1);
      const res = await request(ctx.app.getHttpServer())
        .patch(`/bookings/${createRes.body.id}`)
        .send({
          end_time: newEndTime.toISOString(),
        })
        .set('X-Test-User-Id', ctx.staffUser.id)
        .expect(400);

      expect(res.body.message).toContain('already started');
    });

    it('should block STAFF from canceling booking after start_time', async () => {
      const twoHoursAgo = new Date();
      twoHoursAgo.setHours(twoHoursAgo.getHours() - 2);

      const fourHoursLater = new Date();
      fourHoursLater.setHours(fourHoursLater.getHours() + 4);

      // Admin creates a booking that has started but not ended (duration: 6 hours)
      const createRes = await request(ctx.app.getHttpServer())
        .post('/bookings')
        .send({
          room_id: ctx.testRoom.room_id,
          start_time: twoHoursAgo.toISOString(),
          end_time: fourHoursLater.toISOString(),
        })
        .set('X-Test-User-Id', ctx.adminUser.id)
        .expect(201);

      // Transfer ownership to staff user
      await ctx.bookingRepository.update(createRes.body.id, { user_id: ctx.staffUser.id });

      // Staff tries to cancel
      const res = await request(ctx.app.getHttpServer())
        .delete(`/bookings/${createRes.body.id}`)
        .set('X-Test-User-Id', ctx.staffUser.id)
        .expect(400);

      expect(res.body.message).toContain('already started');
    });

    it('should allow ADMIN to update booking after start_time', async () => {
      const twoHoursAgo = new Date();
      twoHoursAgo.setHours(twoHoursAgo.getHours() - 2);

      const fourHoursLater = new Date();
      fourHoursLater.setHours(fourHoursLater.getHours() + 4);

      const createRes = await request(ctx.app.getHttpServer())
        .post('/bookings')
        .send({
          room_id: ctx.testRoom.room_id,
          start_time: twoHoursAgo.toISOString(),
          end_time: fourHoursLater.toISOString(),
        })
        .set('X-Test-User-Id', ctx.adminUser.id)
        .expect(201);

      const newEndTime = new Date(fourHoursLater.getTime() + 3600000);
      await request(ctx.app.getHttpServer())
        .patch(`/bookings/${createRes.body.id}`)
        .send({
          end_time: newEndTime.toISOString(),
        })
        .set('X-Test-User-Id', ctx.adminUser.id)
        .expect(200);
    });

    it('should allow ADMIN to cancel booking after start_time', async () => {
      const twoHoursAgo = new Date();
      twoHoursAgo.setHours(twoHoursAgo.getHours() - 2);

      const fourHoursLater = new Date();
      fourHoursLater.setHours(fourHoursLater.getHours() + 4);

      const createRes = await request(ctx.app.getHttpServer())
        .post('/bookings')
        .send({
          room_id: ctx.testRoom.room_id,
          start_time: twoHoursAgo.toISOString(),
          end_time: fourHoursLater.toISOString(),
        })
        .set('X-Test-User-Id', ctx.adminUser.id)
        .expect(201);

      await request(ctx.app.getHttpServer())
        .delete(`/bookings/${createRes.body.id}`)
        .set('X-Test-User-Id', ctx.adminUser.id)
        .expect(204);
    });
  });
});
