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
exports.WorkflowsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const workflow_entity_1 = require("./entities/workflow.entity");
const node_entity_1 = require("./entities/node.entity");
const edge_entity_1 = require("./entities/edge.entity");
let WorkflowsService = class WorkflowsService {
    constructor(workflowRepo, nodeRepo, edgeRepo) {
        this.workflowRepo = workflowRepo;
        this.nodeRepo = nodeRepo;
        this.edgeRepo = edgeRepo;
    }
    async findAll() {
        return this.workflowRepo.find({
            relations: ['nodes', 'edges'],
            order: { updatedAt: 'DESC' },
        });
    }
    async findOne(id) {
        const workflow = await this.workflowRepo.findOne({
            where: { id },
            relations: ['nodes', 'edges'],
        });
        if (!workflow) {
            throw new common_1.NotFoundException(`Workflow ${id} not found`);
        }
        return workflow;
    }
    async create(dto) {
        const workflow = this.workflowRepo.create({
            ...dto,
            metadata: dto.metadata || { status: 'draft' },
        });
        return this.workflowRepo.save(workflow);
    }
    async update(id, dto) {
        await this.findOne(id);
        await this.workflowRepo.update(id, dto);
        return this.findOne(id);
    }
    async delete(id) {
        await this.findOne(id);
        await this.workflowRepo.delete(id);
    }
    async updateNodes(workflowId, dto) {
        await this.findOne(workflowId);
        await this.nodeRepo.delete({ workflowId });
        await this.edgeRepo.delete({ workflowId });
        const nodes = dto.nodes.map(n => this.nodeRepo.create({
            nodeId: n.nodeId,
            type: n.type,
            positionX: n.positionX,
            positionY: n.positionY,
            data: n.data,
            workflowId,
        }));
        const edges = dto.edges.map(e => this.edgeRepo.create({
            edgeId: e.edgeId,
            source: e.source,
            target: e.target,
            condition: e.condition,
            workflowId,
        }));
        await this.nodeRepo.save(nodes);
        await this.edgeRepo.save(edges);
        return this.findOne(workflowId);
    }
};
exports.WorkflowsService = WorkflowsService;
exports.WorkflowsService = WorkflowsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(workflow_entity_1.Workflow)),
    __param(1, (0, typeorm_1.InjectRepository)(node_entity_1.WorkflowNode)),
    __param(2, (0, typeorm_1.InjectRepository)(edge_entity_1.WorkflowEdge)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], WorkflowsService);
//# sourceMappingURL=workflows.service.js.map