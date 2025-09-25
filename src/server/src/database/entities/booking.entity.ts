import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';
import { Room } from './room.entity';
import { BookingSeries } from './booking-series.entity';

export enum BookingStatus {
  ACTIVE = 'Active',
  CANCELLED = 'Cancelled'
}

@Entity('bookings')
export class Booking {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  user_id!: string;

  @Column()
  room_id!: string;

  @Column({ type: 'timestamp with time zone' })
  start_time!: Date;

  @Column({ type: 'timestamp with time zone' })
  end_time!: Date;

  @Column({
    type: 'enum',
    enum: BookingStatus
  })
  status!: BookingStatus;

  @Column({ nullable: true })
  booking_series_id!: string;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  @ManyToOne(() => User, user => user.bookings)
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @ManyToOne(() => Room, room => room.bookings)
  @JoinColumn({ name: 'room_id' })
  room!: Room;

  @ManyToOne(() => BookingSeries, series => series.bookings, { nullable: true })
  @JoinColumn({ name: 'booking_series_id' })
  booking_series!: BookingSeries;
}