// src/mailer/mailer.dto.ts
import { IsEmail, IsNotEmpty, IsString, IsNumberString } from 'class-validator';

export class MailerDto {
  @IsNotEmpty()
  @IsString()
  firstName: string;

  @IsNotEmpty()
  @IsString()
  lastName: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;
  
  @IsNotEmpty()
  @IsNumberString()
  phone: string;

  @IsNotEmpty()
  @IsString()
  petType: string;

  @IsNotEmpty()
  @IsString()
  dates: string;

  @IsNotEmpty()
  @IsString()
  recaptchaToken: string; // Field for the reCAPTCHA token from the frontend
}