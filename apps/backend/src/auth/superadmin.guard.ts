import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

@Injectable()
export class SuperadminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const user = context.switchToHttp().getRequest().user as { role?: string } | undefined;
    if (user?.role !== 'SUPERADMIN') {
      throw new ForbiddenException('Solo el superadmin puede realizar esta acción');
    }
    return true;
  }
}
