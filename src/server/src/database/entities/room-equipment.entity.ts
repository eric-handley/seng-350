import { Entity, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, PrimaryColumn } from 'typeorm';
import { Room } from './room.entity';
import { Equipment } from './equipment.entity';

@Entity('room_equipment')
export class RoomEquipment {
  @PrimaryColumn()
  room_id!: string;

  @PrimaryColumn()
  equipment_id!: string;

  @Column({ type: 'integer', nullable: true })
  quantity!: number | null;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  @ManyToOne(() => Room, room => room.room_equipment)
  @JoinColumn({ name: 'room_id' })
  room!: Room;

  @ManyToOne(() => Equipment, equipment => equipment.room_equipment)
  @JoinColumn({ name: 'equipment_id' })
  equipment!: Equipment;
}