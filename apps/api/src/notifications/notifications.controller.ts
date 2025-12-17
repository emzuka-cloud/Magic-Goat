import { Controller, Get, Patch, Param, UseGuards, Request, Delete } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
@UseGuards(AuthGuard('jwt'))
export class NotificationsController {
    constructor(private readonly notificationsService: NotificationsService) { }

    @Get()
    async findAll(@Request() req: any) {
        return this.notificationsService.findAllForUser(req.user.id);
    }

    @Get('unread-count')
    async getUnreadCount(@Request() req: any) {
        const count = await this.notificationsService.getUnreadCount(req.user.id);
        return { count };
    }

    @Patch(':id/read')
    async markAsRead(@Param('id') id: string) {
        return this.notificationsService.markAsRead(id);
    }

    @Patch('read-all')
    async markAllAsRead(@Request() req: any) {
        return this.notificationsService.markAllAsRead(req.user.id);
    }

    @Delete(':id')
    async remove(@Param('id') id: string) {
        return this.notificationsService.remove(id);
    }
}
