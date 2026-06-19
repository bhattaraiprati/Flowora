import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { OrganizationMember } from '../../models/organizationMember.model';
import { OrgMemberStatus } from '../../common/enums';

@Injectable()
export class OrganizationGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    
    // organizationId can come from route params or headers. Let's check both.
    const organizationId = request.params?.organizationId || request.headers?.['x-organization-id'];

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    if (!organizationId) {
      throw new ForbiddenException('Organization ID is missing');
    }

    // Check if the user is a member of the organization
    const membership = await OrganizationMember.findOne({
      where: {
        user_id: user.id,
        org_id: organizationId,
        status: OrgMemberStatus.ACTIVE,
      },
    });

    if (!membership) {
      throw new ForbiddenException('You do not have access to this organization');
    }

    // Inject the organizationId and membership into the request for downstream use
    request.organizationId = organizationId;
    request.organizationRole = membership.role;

    return true;
  }
}
