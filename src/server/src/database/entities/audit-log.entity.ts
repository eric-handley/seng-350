import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ nullable: true })
  user_id!: string | null;

  @Column()
  action!: string;

  @Column()
  route!: string;

  @Column()
  entity_id!: string;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  @ManyToOne(() => User, user => user.audit_logs, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user!: User | null;
}