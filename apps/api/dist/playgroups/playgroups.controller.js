"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlayGroupsController = void 0;
const common_1 = require("@nestjs/common");
const playgroups_service_1 = require("./playgroups.service");
const passport_1 = require("@nestjs/passport");
let PlayGroupsController = class PlayGroupsController {
    playGroupsService;
    constructor(playGroupsService) {
        this.playGroupsService = playGroupsService;
    }
    create(createDto) {
        return this.playGroupsService.create(createDto);
    }
    findAll(userId) {
        return this.playGroupsService.findAllForUser(userId);
    }
    findOne(id) {
        return this.playGroupsService.findOne(id);
    }
    addMember(id, body) {
        return this.playGroupsService.addMember(id, body.identifier);
    }
    removeMember(id, memberId) {
        return this.playGroupsService.removeMember(id, memberId);
    }
    leave(id, req) {
        console.log('🔍 [leave endpoint] groupId:', id, 'userId:', req.user.id);
        return this.playGroupsService.removeMember(id, req.user.id);
    }
    remove(id) {
        return this.playGroupsService.remove(id);
    }
};
exports.PlayGroupsController = PlayGroupsController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PlayGroupsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('user/:userId'),
    __param(0, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PlayGroupsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PlayGroupsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(':id/members'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], PlayGroupsController.prototype, "addMember", null);
__decorate([
    (0, common_1.Delete)(':id/members/:memberId'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('memberId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], PlayGroupsController.prototype, "removeMember", null);
__decorate([
    (0, common_1.Post)(':id/leave'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], PlayGroupsController.prototype, "leave", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PlayGroupsController.prototype, "remove", null);
exports.PlayGroupsController = PlayGroupsController = __decorate([
    (0, common_1.Controller)('playgroups'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    __metadata("design:paramtypes", [playgroups_service_1.PlayGroupsService])
], PlayGroupsController);
//# sourceMappingURL=playgroups.controller.js.map