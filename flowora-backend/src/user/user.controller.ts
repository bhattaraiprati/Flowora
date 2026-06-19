import { Body, Controller, Post } from '@nestjs/common';
import { UserService } from './user.service';
import { RegisterOrganization } from '../common/interface';

@Controller('api/user')
export class UserController {

    constructor(private userService: UserService){}

    @Post('registerOrganizer')
    registerOrganizer(@Body() body: RegisterOrganization) {
        return this.userService.registerOrganizer(body);
    }
}
