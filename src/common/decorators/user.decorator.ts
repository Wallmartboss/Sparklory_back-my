import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const UserDecorator = createParamDecorator(
  (data: string, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    if (!data) return request.user;
    if (data === 'id' || data === '_id') {
      return request.user?._id || request.user?.id;
    }
    return request.user?.[data];
  },
);
