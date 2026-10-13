import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JoinRequest, JoinRequestStatus } from './join-request.entity';
import { User } from '../users/entities/user.entity';

/** Which tournament or league a request is for. */
export type JoinTarget = { tournament: { id: string } } | { league: { id: string } };

@Injectable()
export class JoinRequestsService {
    constructor(@InjectRepository(JoinRequest) private repo: Repository<JoinRequest>) { }

    /** Returns the existing pending request instead of creating a duplicate. `created` tells the caller whether to notify. */
    async request(target: JoinTarget, user: User): Promise<{ request: JoinRequest; created: boolean }> {
        const existing = await this.repo.findOne({ where: { ...target, user: { id: user.id }, status: JoinRequestStatus.PENDING } });
        if (existing) return { request: existing, created: false };
        const request = await this.repo.save(this.repo.create({ ...target, user }));
        return { request, created: true };
    }

    pending(target: JoinTarget): Promise<JoinRequest[]> {
        return this.repo.find({ where: { ...target, status: JoinRequestStatus.PENDING }, relations: ['user'], order: { created_at: 'ASC' } });
    }

    /**
     * Answers a pending request of this target. `apply` runs first (e.g. add the member); if it throws
     * (tournament full...), the request stays pending so the owner can retry.
     */
    async decide(requestId: string, target: JoinTarget, approve: boolean, apply: (request: JoinRequest) => Promise<unknown>): Promise<JoinRequest> {
        const request = await this.repo.findOne({ where: { id: requestId, ...target }, relations: ['user'] });
        if (!request) throw new NotFoundException('This join request was not found.');
        if (request.status !== JoinRequestStatus.PENDING) throw new BadRequestException('This request was already answered.');
        await apply(request);
        request.status = approve ? JoinRequestStatus.APPROVED : JoinRequestStatus.DECLINED;
        return this.repo.save(request);
    }
}
