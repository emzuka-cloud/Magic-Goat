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
exports.Pairing = exports.PairingResult = void 0;
const typeorm_1 = require("typeorm");
const tournament_entity_1 = require("./tournament.entity");
const user_entity_1 = require("../../users/entities/user.entity");
var PairingResult;
(function (PairingResult) {
    PairingResult["PENDING"] = "pending";
    PairingResult["P1_WIN"] = "p1_win";
    PairingResult["P2_WIN"] = "p2_win";
    PairingResult["DRAW"] = "draw";
})(PairingResult || (exports.PairingResult = PairingResult = {}));
let Pairing = class Pairing {
    id;
    tournament;
    round;
    player1;
    player2;
    player3;
    player4;
    result;
    order;
    next_pairing;
};
exports.Pairing = Pairing;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Pairing.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => tournament_entity_1.Tournament, { onDelete: 'CASCADE' }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", tournament_entity_1.Tournament)
], Pairing.prototype, "tournament", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    (0, typeorm_1.Index)(),
    __metadata("design:type", Number)
], Pairing.prototype, "round", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { nullable: true }),
    __metadata("design:type", user_entity_1.User)
], Pairing.prototype, "player1", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { nullable: true }),
    __metadata("design:type", user_entity_1.User)
], Pairing.prototype, "player2", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { nullable: true }),
    __metadata("design:type", user_entity_1.User)
], Pairing.prototype, "player3", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { nullable: true }),
    __metadata("design:type", user_entity_1.User)
], Pairing.prototype, "player4", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: PairingResult,
        default: PairingResult.PENDING,
    }),
    __metadata("design:type", String)
], Pairing.prototype, "result", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], Pairing.prototype, "order", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Pairing, { nullable: true }),
    __metadata("design:type", Pairing)
], Pairing.prototype, "next_pairing", void 0);
exports.Pairing = Pairing = __decorate([
    (0, typeorm_1.Entity)('pairings')
], Pairing);
//# sourceMappingURL=pairing.entity.js.map