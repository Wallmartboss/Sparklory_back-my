import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class MongooseTransformInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map(data => {
        if (Array.isArray(data)) {
          return data.map(this.transform);
        }
        return this.transform(data);
      }),
    );
  }

  private transform(data: any) {
    if (!data) return data;
    if (data._id) {
      data._id = data._id.toString();
    }
    delete data.__v;
    delete data.$__;
    return data;
  }
}
