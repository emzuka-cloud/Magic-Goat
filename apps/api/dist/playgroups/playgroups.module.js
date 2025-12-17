"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlayGroupsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const playgroups_service_1 = require("./playgroups.service");
const playgroups_controller_1 = require("./playgroups.controller");
const playgroups_entity_1 = require("./playgroups.entity");
const user_entity_1 = require("../users/entities/user.entity");
const users_module_1 = require("../users/users.module");
const notifications_module_1 = require("../notifications/notifications.module");
let PlayGroupsModule = class PlayGroupsModule {
};
exports.PlayGroupsModule = PlayGroupsModule;
exports.PlayGroupsModule = PlayGroupsModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([playgroups_entity_1.PlayGroup, user_entity_1.User]), users_module_1.UsersModule, notifications_module_1.NotificationsModule],
        controllers: [playgroups_controller_1.PlayGroupsController],
        providers: [playgroups_service_1.PlayGroupsService],
        exports: [playgroups_service_1.PlayGroupsService],
    })
], PlayGroupsModule);
//# sourceMappingURL=playgroups.module.js.map