/* eslint-disable prettier/prettier */
import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),

  PORT: Joi.number()
    .port()
    .default(5000),

  CLIENT_URL: Joi.string()
    .uri()
    .required(),

  DATABASE_URL: Joi.string()
    .required(),

  JWT_ACCESS_SECRET: Joi.string()
    .min(32)
    .required(),

  // eslint-disable-next-line prettier/prettier
  JWT_REFRESH_SECRET: Joi.string()
    .min(32)
    .required(),

  JWT_ACCESS_EXPIRES: Joi.string()
    .default('15m'),

  JWT_REFRESH_EXPIRES: Joi.string()
    .default('7d'),
});