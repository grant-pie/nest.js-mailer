import { Injectable, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerLimitDetail } from '@nestjs/throttler';

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  protected override async getTracker(req: Record<string, any>): Promise<string> {
    // Combine IP and route path for tracking
    return `${req.ip}-${req.route?.path || req.path}`;
  }

  protected override async throwThrottlingException(
    context: ExecutionContext,
    throttlerLimitDetail: ThrottlerLimitDetail,
  ): Promise<void> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    
    // Add custom headers
    const retryAfter = Math.ceil(throttlerLimitDetail.ttl / 1000); // Convert ms to seconds
    response.header('Retry-After', `${retryAfter}`);
    
    // Log the throttled requests with more details
    console.warn(`Rate limit exceeded for IP: ${request.ip}, Path: ${request.path}`);
    console.warn(`Limit: ${throttlerLimitDetail.limit}`);
    
    // Throw a custom exception with a user-friendly message
    throw new HttpException({
      statusCode: HttpStatus.TOO_MANY_REQUESTS,
      error: 'Too Many Requests',
      message: 'You have made too many requests recently. Please try again later.',
      retryAfter: retryAfter,
    }, HttpStatus.TOO_MANY_REQUESTS);
  }
}