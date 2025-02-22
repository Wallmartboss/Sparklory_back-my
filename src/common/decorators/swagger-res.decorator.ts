import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';

export const ApiCustomResponse = (
  status: HttpStatus,
  example?: any,
  description?: string,
) =>
  applyDecorators(
    ApiResponse({
      status,
      description: description || undefined,
      content: {
        'application/json': {
          example,
        },
      },
    }),
  );
