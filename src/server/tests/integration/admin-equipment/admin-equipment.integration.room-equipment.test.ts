import { setupAdminEquipmentTest, AdminEquipmentTestContext } from './admin-equipment.integration.test-setup';

describe('Admin Room-Equipment CRUD', () => {
  let ctx: AdminEquipmentTestContext;
  let equipmentId: string;

  beforeAll(async () => {
    ctx = await setupAdminEquipmentTest();
    // Create equipment for room-equipment tests
    const response = await ctx.adminAgent
      .post('/equipment')
      .send({
        name: 'Room Equipment Test Item',
      })
      .expect(201);
    equipmentId = response.body.id;
  });

  afterAll(async () => {
    // Cleanup equipment
    await ctx.equipmentRepository.delete({ id: equipmentId });
    await ctx.buildingRepository.delete({ short_name: 'EQTEST' });
    await ctx.app.close();
  });

  describe('POST /room-equipment - Add equipment to room', () => {
    it('should add equipment to room as admin', async () => {
      const response = await ctx.adminAgent
        .post('/room-equipment')
        .send({
          room_id: 'EQTEST-101',
          equipment_id: equipmentId,
          quantity: 3,
        })
        .expect(201);

      expect(response.body).toMatchObject({
        room_id: 'EQTEST-101',
        equipment_id: equipmentId,
        quantity: 3,
      });
      expect(response.body.created_at).toBeDefined();
      expect(response.body.updated_at).toBeDefined();

      // Cleanup
      await ctx.roomEquipmentRepository.delete({ room_id: 'EQTEST-101', equipment_id: equipmentId });
    });

    it('should add equipment to room without quantity', async () => {
      const response = await ctx.adminAgent
        .post('/room-equipment')
        .send({
          room_id: 'EQTEST-101',
          equipment_id: equipmentId,
        })
        .expect(201);

      expect(response.body).toMatchObject({
        room_id: 'EQTEST-101',
        equipment_id: equipmentId,
        quantity: null,
      });

      // Cleanup
      await ctx.roomEquipmentRepository.delete({ room_id: 'EQTEST-101', equipment_id: equipmentId });
    });

    it('should reject adding equipment as staff', async () => {
      const response = await ctx.staffAgent
        .post('/room-equipment')
        .send({
          room_id: 'EQTEST-101',
          equipment_id: equipmentId,
          quantity: 1,
        })
        .expect(403);

      expect(response.body.message).toBe('Forbidden resource');
    });

    it('should reject non-existent room', async () => {
      const response = await ctx.adminAgent
        .post('/room-equipment')
        .send({
          room_id: 'NOTFOUND-999',
          equipment_id: equipmentId,
          quantity: 1,
        })
        .expect(404);

      expect(response.body.message).toBe('Room with ID NOTFOUND-999 not found');
    });

    it('should reject non-existent equipment', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await ctx.adminAgent
        .post('/room-equipment')
        .send({
          room_id: 'EQTEST-101',
          equipment_id: fakeId,
          quantity: 1,
        })
        .expect(404);

      expect(response.body.message).toBe(`Equipment with ID ${fakeId} not found`);
    });

    it('should reject duplicate room-equipment relationship', async () => {
      // Create first relationship
      await ctx.adminAgent
        .post('/room-equipment')
        .send({
          room_id: 'EQTEST-101',
          equipment_id: equipmentId,
          quantity: 2,
        })
        .expect(201);

      // Try to create duplicate
      const response = await ctx.adminAgent
        .post('/room-equipment')
        .send({
          room_id: 'EQTEST-101',
          equipment_id: equipmentId,
          quantity: 5,
        })
        .expect(409);

      expect(response.body.message).toBe(
        `Equipment ${equipmentId} already exists in room EQTEST-101`
      );

      // Cleanup
      await ctx.roomEquipmentRepository.delete({ room_id: 'EQTEST-101', equipment_id: equipmentId });
    });

    it('should reject invalid quantity (less than 1)', async () => {
      await ctx.adminAgent
        .post('/room-equipment')
        .send({
          room_id: 'EQTEST-101',
          equipment_id: equipmentId,
          quantity: 0,
        })
        .expect(400);
    });
  });

  describe('PATCH /room-equipment/:room_id/:equipment_id - Update room-equipment', () => {
    beforeEach(async () => {
      await ctx.adminAgent
        .post('/room-equipment')
        .send({
          room_id: 'EQTEST-101',
          equipment_id: equipmentId,
          quantity: 2,
        })
        .expect(201);
    });

    afterEach(async () => {
      await ctx.roomEquipmentRepository.delete({ room_id: 'EQTEST-101', equipment_id: equipmentId });
    });

    it('should update quantity as admin', async () => {
      const response = await ctx.adminAgent
        .patch(`/room-equipment/EQTEST-101/${equipmentId}`)
        .send({
          quantity: 10,
        })
        .expect(200);

      expect(response.body).toMatchObject({
        room_id: 'EQTEST-101',
        equipment_id: equipmentId,
        quantity: 10,
      });
    });

    it('should reject update as staff', async () => {
      const response = await ctx.staffAgent
        .patch(`/room-equipment/EQTEST-101/${equipmentId}`)
        .send({
          quantity: 20,
        })
        .expect(403);

      expect(response.body.message).toBe('Forbidden resource');
    });

    it('should return 404 for non-existent relationship', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await ctx.adminAgent
        .patch(`/room-equipment/EQTEST-101/${fakeId}`)
        .send({
          quantity: 5,
        })
        .expect(404);

      expect(response.body.message).toBe(
        `Room-Equipment relationship not found for room EQTEST-101 and equipment ${fakeId}`
      );
    });

    it('should reject invalid quantity', async () => {
      await ctx.adminAgent
        .patch(`/room-equipment/EQTEST-101/${equipmentId}`)
        .send({
          quantity: -1,
        })
        .expect(400);
    });
  });

  describe('DELETE /room-equipment/:room_id/:equipment_id - Remove equipment from room', () => {
    beforeEach(async () => {
      await ctx.adminAgent
        .post('/room-equipment')
        .send({
          room_id: 'EQTEST-101',
          equipment_id: equipmentId,
          quantity: 3,
        })
        .expect(201);
    });

    it('should remove equipment from room as admin', async () => {
      await ctx.adminAgent
        .delete(`/room-equipment/EQTEST-101/${equipmentId}`)
        .expect(204);

      // Verify deletion
      const roomEquipment = await ctx.roomEquipmentRepository.findOne({
        where: { room_id: 'EQTEST-101', equipment_id: equipmentId },
      });
      expect(roomEquipment).toBeNull();
    });

    it('should reject removal as staff', async () => {
      const response = await ctx.staffAgent
        .delete(`/room-equipment/EQTEST-101/${equipmentId}`)
        .expect(403);

      expect(response.body.message).toBe('Forbidden resource');

      // Cleanup
      await ctx.roomEquipmentRepository.delete({ room_id: 'EQTEST-101', equipment_id: equipmentId });
    });

    it('should return 404 for non-existent relationship', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await ctx.adminAgent
        .delete(`/room-equipment/EQTEST-101/${fakeId}`)
        .expect(404);

      expect(response.body.message).toBe(
        `Room-Equipment relationship not found for room EQTEST-101 and equipment ${fakeId}`
      );

      // Cleanup
      await ctx.roomEquipmentRepository.delete({ room_id: 'EQTEST-101', equipment_id: equipmentId });
    });
  });
});
