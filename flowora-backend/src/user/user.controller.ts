import { Body, Controller, Post } from '@nestjs/common';
import { UserService } from './user.service';
import { RegisterOrganization } from '../common/interface';
import { addAbortListener } from 'events';
import { ApiBearerAuth, ApiOAuth2, ApiTags } from '@nestjs/swagger';

@ApiBearerAuth()
// @ApiOAuth2(['pets:write'])
@ApiTags('User')
@Controller('api/user')
export class UserController {

    constructor(private userService: UserService){}

    @Post('registerOrganizer')
    registerOrganizer(@Body() body: RegisterOrganization) {
        return this.userService.registerOrganizer(body);
    }
}

