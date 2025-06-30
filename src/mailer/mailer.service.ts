import { Injectable, BadRequestException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Resend } from 'resend';
import * as sanitizeHtml from 'sanitize-html';
import * as validator from 'validator';
import * as dotenv from 'dotenv';

dotenv.config();

@Injectable()
export class MailerService {
  private resend: Resend;

  constructor() {
    this.resend = new Resend(process.env.RESEND_API_KEY || '');
  }

  private sanitizeInput(input: string): string {
    return sanitizeHtml(input, {
      allowedTags: [], 
      allowedAttributes: {},
    }).trim();
  }

  private isValidEmail(email: string): boolean {
    return validator.isEmail(email);
  }

  async sendMail(to: string, from: string, subject: string, text: string) {
    // Validate and sanitize inputs
    if (!this.isValidEmail(to) || !this.isValidEmail(from)) {
      throw new BadRequestException('Invalid email format');
    }

    const sanitizedSubject = this.sanitizeInput(subject);
    const sanitizedText = this.sanitizeInput(text);

    try {
      // Send email via Resend
      const response = await this.resend.emails.send({
        from: from.trim(),
        to: to.trim(),
        subject: sanitizedSubject,
        text: sanitizedText,
      });
      return { response, data: {message: 'Email sent succesfully'} };
    } catch (error) {
      console.error('Comprehensive error sending emails:', error);
      throw new Error(`Failed to send emails: ${error.message}`);
    }
  }
}