import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Booking } from './booking.entity';
import { BookingSeries } from './booking-series.entity';
import { AuditLog } from './audit-log.entity';

export enum UserRole {
  STAFF = 'Staff',
  REGISTRAR = 'Registrar',
  ADMIN = 'Admin'
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  email!: string;

  @Column()
  password_hash!: string;

  @Column()
  first_name!: string;

  @Column()
  last_name!: string;

  @Column({
    type: 'enum',
    enum: UserRole
  })
  role!: UserRole;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  @OneToMany(() => Booking, booking => booking.user)
  bookings!: Booking[];

  @OneToMany(() => BookingSeries, series => series.user)
  booking_series!: BookingSeries[];

  @OneToMany(() => AuditLog, log => log.user)
  audit_logs!: AuditLog[];
}