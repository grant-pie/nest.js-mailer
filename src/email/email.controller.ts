import { Controller, Get, Post, Body, Param, HttpException, HttpStatus } from '@nestjs/common';
import { EmailService } from './email.service';
import { Email } from './email.entity';

@Controller('emails')
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @Get()
  async findAll(): Promise<Email[]> {
    return this.emailService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Email> {
    const email = await this.emailService.findOne(+id);
    if (!email) {
      throw new HttpException('Email not found', HttpStatus.NOT_FOUND);
    }
    return email;
  }

  @Post()
  async create(@Body() createEmailDto: Partial<Email>): Promise<Email> {
    return this.emailService.create(createEmailDto);
  }
}