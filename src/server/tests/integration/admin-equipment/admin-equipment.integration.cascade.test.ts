import { setupAdminEquipmentTest, AdminEquipmentTestContext } from './admin-equipment.integration.test-setup';

describe('Admin Equipment - Cascade Delete Behavior', () => {
  let ctx: AdminEquipmentTestContext;

  beforeAll(async () => {
    ctx = await setupAdminEquipmentTest();
  });

  afterAll(async () => {
    await ctx.buildingRepository.delete({ short_name: 'EQTEST' });
    await ctx.app.close();
  });

  it('should cascade delete room-equipment when room is deleted', async () => {
    // Create equipment
    const equipmentResponse = await ctx.adminAgent
      .post('/equipment')
      .send({
        name: `Cascade Room Delete Test ${Date.now()}`,
      })
      .expect(201);

    const equipmentId = equipmentResponse.body.id;

    // Create room
    await ctx.adminAgent
      .post('/rooms')
      .send({
        building_short_name: 'EQTEST',
        room_number: '999',
        capacity: 10,
        room_type: 'Classroom',
        url: 'https://example.com/cascade-999',
      })
      .expect(201);

    // Add equipment to room
    await ctx.adminAgent
      .post('/room-equipment')
      .send({
        room_id: 'EQTEST-999',
        equipment_id: equipmentId,
        quantity: 1,
      })
      .expect(201);

    // Verify room-equipment exists
    const roomEquipmentBefore = await ctx.roomEquipmentRepository.findOne({
      where: { room_id: 'EQTEST-999', equipment_id: equipmentId },
    });
    expect(roomEquipmentBefore).toBeDefined();

    // Delete room
    await ctx.adminAgent
      .delete('/rooms/EQTEST-999')
      .expect(204);

    // Verify room-equipment was cascade deleted
    const roomEquipmentAfter = await ctx.roomEquipmentRepository.findOne({
      where: { room_id: 'EQTEST-999', equipment_id: equipmentId },
    });
    expect(roomEquipmentAfter).toBeNull();

    // Equipment should still exist
    const equipment = await ctx.equipmentRepository.findOne({ where: { id: equipmentId } });
    expect(equipment).toBeDefined();

    // Cleanup
    await ctx.equipmentRepository.delete({ id: equipmentId });
  });
});
