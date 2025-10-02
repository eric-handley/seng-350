import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { User } from './user.entity';
import { Room } from './room.entity';
import { Booking } from './booking.entity';

@Entity('booking_series')
export class BookingSeries {
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

  @Column({ type: 'date' })
  series_end_date!: Date;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  @ManyToOne(() => User, user => user.booking_series)
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @ManyToOne(() => Room, room => room.booking_series)
  @JoinColumn({ name: 'room_id' })
  room!: Room;

  @OneToMany(() => Booking, booking => booking.booking_series, { cascade: true })
  bookings!: Booking[];
}