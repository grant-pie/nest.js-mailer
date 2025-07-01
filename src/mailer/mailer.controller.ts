// src/mailer/mailer.controller.ts
//Do not use this controller it is for testing only
import { Controller, Post, Body, UnauthorizedException, HttpException, HttpStatus } from '@nestjs/common';
import { MailerService } from './mailer.service';
import { MailerDto } from './mailer.dto';
import RecaptchaService from '../recaptcha/recaptcha.service';

@Controller('mail')
export class MailerController {
  constructor(
    private readonly mailerService: MailerService,
    private readonly recaptchaService: RecaptchaService,
  ) {}

  @Post('send')
  async sendMail(@Body() mailerDto: MailerDto) {
    const phoneIn = mailerDto.phone;
    const petTypeIn = mailerDto.petType;
    const datesIn = mailerDto.dates;
    const userTo = mailerDto.email;
    const userFrom = process.env.ADMIN_EMAIL || '';
    const userSubject = 'Confirmation: Your message has been sent';
    const userName = mailerDto.firstName + ' ' + mailerDto.lastName;
    const userText = `
    Hi ${userName},\n\n
    Thank you for reaching out. We will get back to you shortly:\n\n.
    Grant Pieterse - Pet Sitter
    `;

    const adminTo = process.env.ADMIN_EMAIL || '';
    const adminFrom = adminTo;
    const adminSubject = `New message from ${userName}`;
    const message = `Phone: ${phoneIn} \n\n Pet Types: ${petTypeIn} \n\n Dates: ${datesIn}`
    const adminText = `You have received a new message from ${userName} (${userTo}):\n\n${message}`;
    
    try {
        // reCAPTCHA Enterprise verification
        if (!mailerDto.recaptchaToken) {
            throw new UnauthorizedException('reCAPTCHA token is required');
        }

        const isValidToken = await this.recaptchaService.verify(
            mailerDto.recaptchaToken,
            'contact_form', // Expected action - update this to match your frontend action
            0.5 // Minimum score threshold (0.0-1.0, where 1.0 is most likely human)
        );
        
        if (!isValidToken) {
            throw new UnauthorizedException('reCAPTCHA verification failed. Please try again.');
        }

        // Send emails with client IP
        const adminMailResponse = await this.mailerService.sendMail(
            adminTo, 
            adminFrom, 
            adminSubject, 
            adminText, 
        );
        
        const userMailResponse = await this.mailerService.sendMail(
            userTo, 
            userFrom, 
            userSubject, 
            userText, 
        );
   
        return { 
            success: true, 
            message: 'Email sent successfully', 
            data: { adminMailResponse, userMailResponse }
        };
    } catch (error) {
        if (error instanceof UnauthorizedException) {
            throw error;
        }
        
        console.error('Error sending email:', error);
        throw new HttpException(
            'Failed to send email. Please try again later.',
            HttpStatus.INTERNAL_SERVER_ERROR
        );
    }
  }
}