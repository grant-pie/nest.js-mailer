// src/mailer/mailer.dto.ts
import { IsEmail, IsNotEmpty, IsString, MaxLength, Matches } from 'class-validator';
import { Transform } from 'class-transformer';

export class MailerDto {
  @IsNotEmpty({ message: 'First name is required' })
  @IsString({ message: 'First name must be a string' })
  @MaxLength(50, { message: 'First name cannot exceed 50 characters' })
  @Transform(({ value }) => value?.trim())
  firstName: string;

  @IsNotEmpty({ message: 'Last name is required' })
  @IsString({ message: 'Last name must be a string' })
  @MaxLength(50, { message: 'Last name cannot exceed 50 characters' })
  @Transform(({ value }) => value?.trim())
  lastName: string;

  @IsNotEmpty({ message: 'Email is required' })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @MaxLength(100, { message: 'Email cannot exceed 100 characters' })
  @Transform(({ value }) => value?.trim().toLowerCase())
  email: string;

  @IsNotEmpty({ message: 'Phone number is required' })
  @IsString({ message: 'Phone number must be a string' })
  @MaxLength(20, { message: 'Phone number cannot exceed 20 characters' })
  @Matches(/^[\d\s\-\+\(\)]+$/, { message: 'Please provide a valid phone number' })
  @Transform(({ value }) => value?.trim())
  phone: string;

  @IsNotEmpty({ message: 'Pet type is required' })
  @IsString({ message: 'Pet type must be a string' })
  @MaxLength(200, { message: 'Pet type description cannot exceed 200 characters' })
  @Transform(({ value }) => value?.trim())
  petType: string;

  @IsNotEmpty({ message: 'Dates are required' })
  @IsString({ message: 'Dates must be a string' })
  @MaxLength(200, { message: 'Dates description cannot exceed 200 characters' })
  @Transform(({ value }) => value?.trim())
  dates: string;

  @IsNotEmpty({ message: 'Security verification is required' })
  @IsString({ message: 'Invalid security token' })
  recaptchaToken: string;
}