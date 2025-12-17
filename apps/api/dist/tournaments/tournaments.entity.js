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
exports.Tournament = exports.TournamentStatus = exports.TournamentFormat = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("../users/entities/user.entity");
var TournamentFormat;
(function (TournamentFormat) {
    TournamentFormat[TournamentFormat["PLAYERS_8"] = 8] = "PLAYERS_8";
    TournamentFormat[TournamentFormat["PLAYERS_16"] = 16] = "PLAYERS_16";
    TournamentFormat[TournamentFormat["PLAYERS_32"] = 32] = "PLAYERS_32";
})(TournamentFormat || (exports.TournamentFormat = TournamentFormat = {}));
var TournamentStatus;
(function (TournamentStatus) {
    TournamentStatus["PENDING"] = "PENDING";
    TournamentStatus["ACTIVE"] = "ACTIVE";
    TournamentStatus["COMPLETED"] = "COMPLETED";
})(TournamentStatus || (exports.TournamentStatus = TournamentStatus = {}));
let Tournament = class Tournament {
    id;
    name;
    format;
    status;
    owner;
    participants;
    rounds;
    created_at;
    updated_at;
};
exports.Tournament = Tournament;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Tournament.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Tournament.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: TournamentFormat,
        default: TournamentFormat.PLAYERS_8
    }),
    __metadata("design:type", Number)
], Tournament.prototype, "format", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: TournamentStatus,
        default: TournamentStatus.PENDING
    }),
    __metadata("design:type", String)
], Tournament.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { eager: true }),
    __metadata("design:type", user_entity_1.User)
], Tournament.prototype, "owner", void 0);
__decorate([
    (0, typeorm_1.ManyToMany)(() => user_entity_1.User, { eager: true }),
    (0, typeorm_1.JoinTable)(),
    __metadata("design:type", Array)
], Tournament.prototype, "participants", void 0);
__decorate([
    (0, typeorm_1.Column)('simple-json', { nullable: true }),
    __metadata("design:type", Object)
], Tournament.prototype, "rounds", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Tournament.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Tournament.prototype, "updated_at", void 0);
exports.Tournament = Tournament = __decorate([
    (0, typeorm_1.Entity)()
], Tournament);
//# sourceMappingURL=tournaments.entity.js.map