import { setupAdminEquipmentTest, AdminEquipmentTestContext } from './admin-equipment.integration.test-setup';

describe('Admin Equipment CRUD', () => {
  let ctx: AdminEquipmentTestContext;

  beforeAll(async () => {
    ctx = await setupAdminEquipmentTest();
  });

  afterAll(async () => {
    await ctx.buildingRepository.delete({ short_name: 'EQTEST' });
    await ctx.app.close();
  });

  describe('POST /equipment - Create equipment', () => {
    it('should create new equipment as admin', async () => {
      const response = await ctx.adminAgent
        .post('/equipment')
        .send({
          name: 'Test Projector',
        })
        .expect(201);

      expect(response.body).toMatchObject({
        name: 'Test Projector',
      });
      expect(response.body.id).toBeDefined();
      expect(response.body.created_at).toBeDefined();
      expect(response.body.updated_at).toBeDefined();

      // Cleanup
      await ctx.equipmentRepository.delete({ id: response.body.id });
    });

    it('should reject equipment creation as staff', async () => {
      const response = await ctx.staffAgent
        .post('/equipment')
        .send({
          name: 'Should Fail',
        })
        .expect(403);

      expect(response.body.message).toBe('Forbidden resource');
    });

    it('should reject duplicate equipment name', async () => {
      // Create first equipment
      const firstResponse = await ctx.adminAgent
        .post('/equipment')
        .send({
          name: 'Duplicate Equipment',
        })
        .expect(201);

      // Try to create duplicate
      const response = await ctx.adminAgent
        .post('/equipment')
        .send({
          name: 'Duplicate Equipment',
        })
        .expect(409);

      expect(response.body.message).toBe("Equipment with name 'Duplicate Equipment' already exists");

      // Cleanup
      await ctx.equipmentRepository.delete({ id: firstResponse.body.id });
    });

    it('should reject empty name', async () => {
      await ctx.adminAgent
        .post('/equipment')
        .send({
          name: '',
        })
        .expect(400);
    });
  });

  describe('PATCH /equipment/:id - Update equipment', () => {
    let equipmentId: string;

    beforeEach(async () => {
      const response = await ctx.adminAgent
        .post('/equipment')
        .send({
          name: 'Original Equipment Name',
        })
        .expect(201);
      equipmentId = response.body.id;
    });

    afterEach(async () => {
      await ctx.equipmentRepository.delete({ id: equipmentId });
    });

    it('should update equipment name as admin', async () => {
      const response = await ctx.adminAgent
        .patch(`/equipment/${equipmentId}`)
        .send({
          name: 'Updated Equipment Name',
        })
        .expect(200);

      expect(response.body).toMatchObject({
        id: equipmentId,
        name: 'Updated Equipment Name',
      });
    });

    it('should reject equipment update as staff', async () => {
      const response = await ctx.staffAgent
        .patch(`/equipment/${equipmentId}`)
        .send({
          name: 'Should Fail',
        })
        .expect(403);

      expect(response.body.message).toBe('Forbidden resource');
    });

    it('should return 404 for non-existent equipment', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await ctx.adminAgent
        .patch(`/equipment/${fakeId}`)
        .send({
          name: 'Does Not Exist',
        })
        .expect(404);

      expect(response.body.message).toBe(`Equipment with ID ${fakeId} not found`);
    });

    it('should reject duplicate name when updating', async () => {
      // Create another equipment
      const otherResponse = await ctx.adminAgent
        .post('/equipment')
        .send({
          name: 'Other Equipment',
        })
        .expect(201);

      // Try to update to duplicate name
      const response = await ctx.adminAgent
        .patch(`/equipment/${equipmentId}`)
        .send({
          name: 'Other Equipment',
        })
        .expect(409);

      expect(response.body.message).toBe("Equipment with name 'Other Equipment' already exists");

      // Cleanup
      await ctx.equipmentRepository.delete({ id: otherResponse.body.id });
    });
  });

  describe('DELETE /equipment/:id - Delete equipment', () => {
    it('should delete equipment as admin', async () => {
      // Create equipment
      const createResponse = await ctx.adminAgent
        .post('/equipment')
        .send({
          name: 'To Be Deleted',
        })
        .expect(201);

      const equipmentId = createResponse.body.id;

      // Delete equipment
      await ctx.adminAgent
        .delete(`/equipment/${equipmentId}`)
        .expect(204);

      // Verify deletion
      const equipment = await ctx.equipmentRepository.findOne({ where: { id: equipmentId } });
      expect(equipment).toBeNull();
    });

    it('should reject equipment deletion as staff', async () => {
      // Create equipment
      const createResponse = await ctx.adminAgent
        .post('/equipment')
        .send({
          name: 'Staff Cannot Delete',
        })
        .expect(201);

      const equipmentId = createResponse.body.id;

      // Try to delete as staff
      const response = await ctx.staffAgent
        .delete(`/equipment/${equipmentId}`)
        .expect(403);

      expect(response.body.message).toBe('Forbidden resource');

      // Cleanup
      await ctx.equipmentRepository.delete({ id: equipmentId });
    });

    it('should return 404 for non-existent equipment', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await ctx.adminAgent
        .delete(`/equipment/${fakeId}`)
        .expect(404);

      expect(response.body.message).toBe(`Equipment with ID ${fakeId} not found`);
    });

    it('should cascade delete room-equipment relationships', async () => {
      // Create equipment
      const createResponse = await ctx.adminAgent
        .post('/equipment')
        .send({
          name: `Cascade Test Equipment ${Date.now()}`,
        })
        .expect(201);

      const equipmentId = createResponse.body.id;

      // Add equipment to room
      await ctx.adminAgent
        .post('/room-equipment')
        .send({
          room_id: 'EQTEST-101',
          equipment_id: equipmentId,
          quantity: 5,
        })
        .expect(201);

      // Verify room-equipment exists
      const roomEquipmentBefore = await ctx.roomEquipmentRepository.findOne({
        where: { room_id: 'EQTEST-101', equipment_id: equipmentId },
      });
      expect(roomEquipmentBefore).toBeDefined();

      // Delete equipment
      await ctx.adminAgent
        .delete(`/equipment/${equipmentId}`)
        .expect(204);

      // Verify room-equipment was cascade deleted
      const roomEquipmentAfter = await ctx.roomEquipmentRepository.findOne({
        where: { room_id: 'EQTEST-101', equipment_id: equipmentId },
      });
      expect(roomEquipmentAfter).toBeNull();
    });
  });
});
