// src/mailer/mailer.controller.ts
import { 
  Controller, 
  Post, 
  Body, 
  UnauthorizedException, 
  HttpException, 
  HttpStatus,
  UseGuards,
  Logger,
  Req,
  BadRequestException,
  ValidationPipe,
  UsePipes
} from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { Request } from 'express';
import { MailerService } from './mailer.service';
import { MailerDto } from './mailer.dto';
import RecaptchaService from '../recaptcha/recaptcha.service';

@Controller('mail')
@UseGuards(ThrottlerGuard) // Rate limiting: prevents spam
export class MailerController {
  private readonly logger = new Logger(MailerController.name);

  constructor(
    private readonly mailerService: MailerService,
    private readonly recaptchaService: RecaptchaService,
  ) {}

  @Post('send')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async sendMail(@Body() mailerDto: MailerDto, @Req() request: Request) {
    const clientIp = this.getClientIp(request);
    
    // Log the request for monitoring
    this.logger.log(`Contact form submission from IP: ${clientIp}`);

    try {
      // Validate reCAPTCHA token
      if (!mailerDto.recaptchaToken) {
        this.logger.warn(`Missing reCAPTCHA token from IP: ${clientIp}`);
        throw new BadRequestException('Security verification is required');
      }

      const isValidToken = await this.recaptchaService.verify(
        mailerDto.recaptchaToken,
        'contact_form',
        0.5
      );
      
      if (!isValidToken) {
        this.logger.warn(`reCAPTCHA verification failed from IP: ${clientIp}`);
        throw new UnauthorizedException('Security verification failed. Please try again.');
      }

      // Sanitize and prepare email content
      const sanitizedData = this.sanitizeInput(mailerDto);
      const emailContent = this.prepareEmailContent(sanitizedData);

      // Send emails
      const emailResults = await this.sendEmails(emailContent);

      // Log successful submission
      this.logger.log(`Contact form successfully sent for ${sanitizedData.email} from IP: ${clientIp}`);

      return { 
        success: true, 
        message: 'Your message has been sent successfully. We will get back to you soon!',
        // Don't expose internal details in production
      };

    } catch (error) {
      // Log errors for debugging but don't expose details to client
      this.logger.error(`Contact form error from IP: ${clientIp}`, error.stack);
      
      if (error instanceof UnauthorizedException || error instanceof BadRequestException) {
        throw error;
      }
      
      // Generic error message for production
      throw new HttpException(
        'We are currently experiencing technical difficulties. Please try again later or contact us directly.',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  private getClientIp(request: Request): string {
    return request.ip || 
           request.connection.remoteAddress || 
           request.socket.remoteAddress ||
           (request.headers['x-forwarded-for'] as string)?.split(',')[0] ||
           'unknown';
  }

  private sanitizeInput(data: MailerDto): MailerDto {
    // Basic sanitization - you might want to use a library like DOMPurify for more thorough cleaning
    return {
      ...data,
      firstName: data.firstName?.trim(),
      lastName: data.lastName?.trim(),
      email: data.email?.trim().toLowerCase(),
      message: data.message,
    };
  }

  private prepareEmailContent(data: MailerDto) {
    const userName = `${data.firstName} ${data.lastName}`;
    const adminEmail = process.env.ADMIN_EMAIL;
    
    if (!adminEmail) {
      throw new Error('ADMIN_EMAIL environment variable is not configured');
    }

    return {
      user: {
        to: data.email,
        from: adminEmail,
        subject: 'Confirmation: Your message has been received',
        text: `Hi ${userName},

Thank you for reaching out to us regarding pet sitting services. We have received your message and will get back to you within 24 hours.

Best regards,
Grant Pieterse - Pet Sitter

---
This is an automated confirmation email. Please do not reply to this message.`
      },
      admin: {
        to: adminEmail,
        from: adminEmail,
        subject: `New Contact Form Submission - ${userName}`,
        text: `New contact form submission received:

Contact Information:
- Name: ${userName}
- Email: ${data.email}
- Message: ${data.message}

Please respond to the customer within 24 hours.`
      }
    };
  }

  private async sendEmails(emailContent: any) {
    try {
      // Send both emails
      const [adminResult, userResult] = await Promise.allSettled([
        this.mailerService.sendMail(
          emailContent.admin.to,
          emailContent.admin.from,
          emailContent.admin.subject,
          emailContent.admin.text
        ),
        this.mailerService.sendMail(
          emailContent.user.to,
          emailContent.user.from,
          emailContent.user.subject,
          emailContent.user.text
        )
      ]);

      // Check if admin email failed (critical)
      if (adminResult.status === 'rejected') {
        this.logger.error('Failed to send admin notification email', adminResult.reason);
        throw new Error('Failed to process contact form submission');
      }

      // User email failure is less critical, but log it
      if (userResult.status === 'rejected') {
        this.logger.warn('Failed to send user confirmation email', userResult.reason);
        // Continue - admin got the message, that's what matters most
      }

      return { adminResult, userResult };
    } catch (error) {
      this.logger.error('Email sending failed', error);
      throw error;
    }
  }
}