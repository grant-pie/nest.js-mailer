// src/recaptcha/recaptcha.service.ts
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RecaptchaService {
  private readonly recaptchaVerifyUrl = 'https://www.google.com/recaptcha/api/siteverify';
  private readonly recaptchaSecretKey: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    // Ensure the secret key is a string (not undefined)
    const secretKey = this.configService.get<string>('RECAPTCHA_SECRET_KEY');
    if (!secretKey) {
      throw new Error('RECAPTCHA_SECRET_KEY is not defined in environment variables');
    }
    this.recaptchaSecretKey = secretKey;
  }

  /**
   * Verify reCAPTCHA token
   * @param token The reCAPTCHA token from client
   * @returns Promise resolving to boolean indicating if token is valid
   */
  async verify(token: string): Promise<boolean> {
    try {
      if (!token) {
        throw new HttpException('reCAPTCHA token is required', HttpStatus.BAD_REQUEST);
      }

      const params = new URLSearchParams();
      params.append('secret', this.recaptchaSecretKey);
      params.append('response', token);

      const { data } = await firstValueFrom(
        this.httpService.post(this.recaptchaVerifyUrl, params.toString(), {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }),
      );

      // Google returns a success field and a score between 0.0 and 1.0
      // Higher score means more likely the user is human
      if (data.success && data.score >= 0.5) {
        return true;
      } else {
        console.warn('reCAPTCHA verification failed', data);
        return false;
      }
    } catch (error) {
      console.error('Error verifying reCAPTCHA token:', error);
      return false;
    }
  }
}

// Make sure to export the service
export default RecaptchaService;