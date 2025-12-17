"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TournamentsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const tournaments_service_1 = require("./tournaments.service");
const tournaments_controller_1 = require("./tournaments.controller");
const tournament_entity_1 = require("./entities/tournament.entity");
const participant_entity_1 = require("./entities/participant.entity");
const pairing_entity_1 = require("./entities/pairing.entity");
const invitation_entity_1 = require("./entities/invitation.entity");
const events_module_1 = require("../events/events.module");
const notifications_module_1 = require("../notifications/notifications.module");
const playgroups_entity_1 = require("../playgroups/playgroups.entity");
const user_entity_1 = require("../users/entities/user.entity");
let TournamentsModule = class TournamentsModule {
};
exports.TournamentsModule = TournamentsModule;
exports.TournamentsModule = TournamentsModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([tournament_entity_1.Tournament, participant_entity_1.TournamentParticipant, pairing_entity_1.Pairing, invitation_entity_1.Invitation, playgroups_entity_1.PlayGroup, user_entity_1.User]), events_module_1.EventsModule, notifications_module_1.NotificationsModule],
        controllers: [tournaments_controller_1.TournamentsController],
        providers: [tournaments_service_1.TournamentsService],
    })
], TournamentsModule);
//# sourceMappingURL=tournaments.module.js.map