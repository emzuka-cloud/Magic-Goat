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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Invitation = exports.InvitationStatus = void 0;
const typeorm_1 = require("typeorm");
const tournament_entity_1 = require("./tournament.entity");
const user_entity_1 = require("../../users/entities/user.entity");
var InvitationStatus;
(function (InvitationStatus) {
    InvitationStatus["PENDING"] = "pending";
    InvitationStatus["ACCEPTED"] = "accepted";
    InvitationStatus["DECLINED"] = "declined";
})(InvitationStatus || (exports.InvitationStatus = InvitationStatus = {}));
let Invitation = class Invitation {
    id;
    tournament;
    invitee;
    status;
    created_at;
};
exports.Invitation = Invitation;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Invitation.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => tournament_entity_1.Tournament),
    __metadata("design:type", tournament_entity_1.Tournament)
], Invitation.prototype, "tournament", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    __metadata("design:type", user_entity_1.User)
], Invitation.prototype, "invitee", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: InvitationStatus,
        default: InvitationStatus.PENDING,
    }),
    __metadata("design:type", String)
], Invitation.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Invitation.prototype, "created_at", void 0);
exports.Invitation = Invitation = __decorate([
    (0, typeorm_1.Entity)('invitations')
], Invitation);
//# sourceMappingURL=invitation.entity.js.map