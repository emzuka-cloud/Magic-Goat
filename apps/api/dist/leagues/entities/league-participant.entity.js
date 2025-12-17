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
exports.LeagueParticipant = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("../../users/entities/user.entity");
const league_entity_1 = require("./league.entity");
let LeagueParticipant = class LeagueParticipant {
    id;
    league;
    user;
    points;
    matches_played;
    matches_won;
    matches_drawn;
    matches_lost;
    omw_percentage;
};
exports.LeagueParticipant = LeagueParticipant;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], LeagueParticipant.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => league_entity_1.League, { onDelete: 'CASCADE' }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", league_entity_1.League)
], LeagueParticipant.prototype, "league", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.Index)(),
    __metadata("design:type", user_entity_1.User)
], LeagueParticipant.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], LeagueParticipant.prototype, "points", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], LeagueParticipant.prototype, "matches_played", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], LeagueParticipant.prototype, "matches_won", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], LeagueParticipant.prototype, "matches_drawn", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], LeagueParticipant.prototype, "matches_lost", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'float', default: 0 }),
    __metadata("design:type", Number)
], LeagueParticipant.prototype, "omw_percentage", void 0);
exports.LeagueParticipant = LeagueParticipant = __decorate([
    (0, typeorm_1.Entity)('league_participants'),
    (0, typeorm_1.Unique)(['league', 'user']),
    (0, typeorm_1.Index)(['points', 'omw_percentage'])
], LeagueParticipant);
//# sourceMappingURL=league-participant.entity.js.map