import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Building } from './building.entity';
import { Booking } from './booking.entity';
import { BookingSeries } from './booking-series.entity';
import { RoomEquipment } from './room-equipment.entity';

export enum RoomType {
  CLASSROOM = 'Classroom',
  LECTURE_THEATRE = 'Lecture theatre',
  MULTI_ACCESS_CLASSROOM = 'Multi-access classroom',
  FLURY_HALL = 'Flury Hall'
}

@Entity('rooms')
export class Room {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  room!: string;

  @Column()
  building_id!: string;

  @Column()
  capacity!: number;

  @Column({
    type: 'enum',
    enum: RoomType
  })
  room_type!: RoomType;

  @Column()
  url!: string;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  @ManyToOne(() => Building, building => building.rooms)
  @JoinColumn({ name: 'building_id' })
  building!: Building;

  @OneToMany(() => Booking, booking => booking.room)
  bookings!: Booking[];

  @OneToMany(() => BookingSeries, series => series.room)
  booking_series!: BookingSeries[];

  @OneToMany(() => RoomEquipment, equipment => equipment.room)
  room_equipment!: RoomEquipment[];
}