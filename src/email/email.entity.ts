import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('emails')
export class Email {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'inet', name: 'sender_ip', nullable: true })
  senderIp: string | null;

  @Column({ type: 'varchar', length: 255, default: '' })
  recipient: string;

  @Column({ type: 'varchar', length: 255, default: '' })
  sender: string;

  @Column({ type: 'text', default: '' })
  subject: string;

  @Column({ type: 'text', default: '' })
  body: string;

  @CreateDateColumn({ name: 'sent_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  sentAt: Date;

  @Column({ name: 'service_id', type: 'integer', nullable: false, default: 0 })
  serviceId: number;
}