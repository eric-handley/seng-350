import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';

export enum EntityType {
  USER = 'User',
  BUILDING = 'Building',
  ROOM = 'Room',
  EQUIPMENT = 'Equipment',
  ROOM_EQUIPMENT = 'RoomEquipment',
  BOOKING = 'Booking',
  BOOKING_SERIES = 'BookingSeries'
}

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  user_id!: string;

  @Column()
  action!: string;

  @Column({
    type: 'enum',
    enum: EntityType
  })
  entity_type!: EntityType;

  @Column()
  entity_id!: string;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  @ManyToOne(() => User, user => user.audit_logs)
  @JoinColumn({ name: 'user_id' })
  user!: User;
}