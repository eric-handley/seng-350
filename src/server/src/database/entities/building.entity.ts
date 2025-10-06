import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Room } from './room.entity';

@Entity('buildings')
export class Building {
  @PrimaryColumn()
  short_name!: string;

  @Column({ unique: true })
  name!: string;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  @OneToMany(() => Room, room => room.building, { cascade: true, onDelete: 'CASCADE' })
  rooms!: Room[];
}