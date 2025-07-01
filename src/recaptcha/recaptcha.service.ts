// src/recaptcha/recaptcha.service.ts
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ConfigService } from '@nestjs/config';

interface RecaptchaEnterpriseResponse {
  tokenProperties: {
    valid: boolean;
    invalidReason?: string;
    hostname: string;
    action: string;
    createTime: string;
  };
  riskAnalysis: {
    score: number;
    reasons: string[];
  };
  name: string;
}

@Injectable()
export class RecaptchaService {
  private readonly recaptchaEnterpriseUrl: string;
  private readonly projectId: string;
  private readonly apiKey: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    // Get required environment variables
    const projectId = this.configService.get<string>('RECAPTCHA_PROJECT_ID');
    const apiKey = this.configService.get<string>('RECAPTCHA_API_KEY');

    if (!projectId) {
      throw new Error('RECAPTCHA_PROJECT_ID is not defined in environment variables');
    }
    if (!apiKey) {
      throw new Error('RECAPTCHA_API_KEY is not defined in environment variables');
    }

    this.projectId = projectId;
    this.apiKey = apiKey;
    this.recaptchaEnterpriseUrl = `https://recaptchaenterprise.googleapis.com/v1/projects/${this.projectId}/assessments`;
  }

  /**
   * Verify reCAPTCHA Enterprise token
   * @param token The reCAPTCHA token from client
   * @param expectedAction The expected action (optional, for additional security)
   * @param minScore Minimum acceptable score (default: 0.5)
   * @returns Promise resolving to boolean indicating if token is valid
   */
  async verify(
    token: string, 
    expectedAction?: string, 
    minScore: number = 0.5
  ): Promise<boolean> {
    try {
      if (!token) {
        throw new HttpException('reCAPTCHA token is required', HttpStatus.BAD_REQUEST);
      }

      const requestBody = {
        event: {
          token,
          siteKey: this.configService.get<string>('RECAPTCHA_SITE_KEY'),
          expectedAction: expectedAction || 'submit', // Default action
        },
      };

      const { data } = await firstValueFrom(
        this.httpService.post<RecaptchaEnterpriseResponse>(
          `${this.recaptchaEnterpriseUrl}?key=${this.apiKey}`,
          requestBody,
          {
            headers: {
              'Content-Type': 'application/json',
            },
          },
        ),
      );

      // Check if token is valid
      if (!data.tokenProperties?.valid) {
        console.warn('reCAPTCHA Enterprise token invalid:', {
          reason: data.tokenProperties?.invalidReason,
          token: token.substring(0, 20) + '...', // Log partial token for debugging
        });
        return false;
      }

      // Check action if specified
      if (expectedAction && data.tokenProperties.action !== expectedAction) {
        console.warn('reCAPTCHA Enterprise action mismatch:', {
          expected: expectedAction,
          actual: data.tokenProperties.action,
        });
        return false;
      }

      // Check risk score
      const score = data.riskAnalysis?.score ?? 0;
      if (score < minScore) {
        console.warn('reCAPTCHA Enterprise score too low:', {
          score,
          minScore,
          reasons: data.riskAnalysis?.reasons,
        });
        return false;
      }

      console.log('reCAPTCHA Enterprise verification successful:', {
        score,
        action: data.tokenProperties.action,
        hostname: data.tokenProperties.hostname,
      });

      return true;
    } catch (error) {
      console.error('Error verifying reCAPTCHA Enterprise token:', error);
      
      // If it's an HTTP error, log the response for debugging
      if (error.response) {
        console.error('reCAPTCHA Enterprise API error:', {
          status: error.response.status,
          data: error.response.data,
        });
      }
      
      return false;
    }
  }

  /**
   * Get detailed assessment information (useful for debugging)
   * @param token The reCAPTCHA token from client
   * @returns Promise resolving to full assessment data
   */
  async getAssessment(token: string): Promise<RecaptchaEnterpriseResponse | null> {
    try {
      if (!token) {
        throw new HttpException('reCAPTCHA token is required', HttpStatus.BAD_REQUEST);
      }

      const requestBody = {
        event: {
          token,
          siteKey: this.configService.get<string>('RECAPTCHA_SITE_KEY'),
        },
      };

      const { data } = await firstValueFrom(
        this.httpService.post<RecaptchaEnterpriseResponse>(
          `${this.recaptchaEnterpriseUrl}?key=${this.apiKey}`,
          requestBody,
          {
            headers: {
              'Content-Type': 'application/json',
            },
          },
        ),
      );

      return data;
    } catch (error) {
      console.error('Error getting reCAPTCHA Enterprise assessment:', error);
      return null;
    }
  }
}

export default RecaptchaService;