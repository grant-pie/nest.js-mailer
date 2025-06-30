import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Email } from './email.entity';

@Injectable()
export class EmailService {
  constructor(
    @InjectRepository(Email)
    private emailRepository: Repository<Email>,
  ) {}

  findAll(): Promise<Email[]> {
    return this.emailRepository.find();
  }

  findOne(id: number): Promise<Email | null> {
    return this.emailRepository.findOne({ where: { id } });
  }

  async create(email: Partial<Email>): Promise<Email> {
    const newEmail = this.emailRepository.create(email);
    return this.emailRepository.save(newEmail);
  }
}