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
const user_entity_1 = require("../../users/entities/user.entity");
const participant_entity_1 = require("./participant.entity");
var TournamentFormat;
(function (TournamentFormat) {
    TournamentFormat["SWISS"] = "swiss";
    TournamentFormat["SINGLE_ELIMINATION"] = "single_elimination";
    TournamentFormat["COMMANDER"] = "commander";
})(TournamentFormat || (exports.TournamentFormat = TournamentFormat = {}));
var TournamentStatus;
(function (TournamentStatus) {
    TournamentStatus["UPCOMING"] = "upcoming";
    TournamentStatus["ACTIVE"] = "active";
    TournamentStatus["COMPLETED"] = "completed";
})(TournamentStatus || (exports.TournamentStatus = TournamentStatus = {}));
let Tournament = class Tournament {
    id;
    name;
    format;
    status;
    created_by;
    participants;
    capacity;
    rounds;
    current_round;
    round_start_time;
    round_duration_minutes;
    timer_paused;
    created_at;
    league;
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
        default: TournamentFormat.SWISS,
    }),
    __metadata("design:type", String)
], Tournament.prototype, "format", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: TournamentStatus,
        default: TournamentStatus.UPCOMING,
    }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], Tournament.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.Index)(),
    __metadata("design:type", user_entity_1.User)
], Tournament.prototype, "created_by", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => participant_entity_1.TournamentParticipant, participant => participant.tournament),
    __metadata("design:type", Array)
], Tournament.prototype, "participants", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 8 }),
    __metadata("design:type", Number)
], Tournament.prototype, "capacity", void 0);
__decorate([
    (0, typeorm_1.Column)('simple-json', { nullable: true }),
    __metadata("design:type", Object)
], Tournament.prototype, "rounds", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 1 }),
    __metadata("design:type", Number)
], Tournament.prototype, "current_round", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], Tournament.prototype, "round_start_time", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 50 }),
    __metadata("design:type", Number)
], Tournament.prototype, "round_duration_minutes", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], Tournament.prototype, "timer_paused", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Tournament.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)('League', 'tournaments', { nullable: true }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", Object)
], Tournament.prototype, "league", void 0);
exports.Tournament = Tournament = __decorate([
    (0, typeorm_1.Entity)('tournaments')
], Tournament);
//# sourceMappingURL=tournament.entity.js.map