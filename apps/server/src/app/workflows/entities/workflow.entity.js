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
exports.Workflow = void 0;
const typeorm_1 = require("typeorm");
const node_entity_1 = require("./node.entity");
const edge_entity_1 = require("./edge.entity");
let Workflow = class Workflow {
};
exports.Workflow = Workflow;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Workflow.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Workflow.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Workflow.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: '1.0.0' }),
    __metadata("design:type", String)
], Workflow.prototype, "version", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb' }),
    __metadata("design:type", Object)
], Workflow.prototype, "trigger", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], Workflow.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => node_entity_1.WorkflowNode, node => node.workflow, { cascade: true }),
    __metadata("design:type", Array)
], Workflow.prototype, "nodes", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => edge_entity_1.WorkflowEdge, edge => edge.workflow, { cascade: true }),
    __metadata("design:type", Array)
], Workflow.prototype, "edges", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Workflow.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Workflow.prototype, "updatedAt", void 0);
exports.Workflow = Workflow = __decorate([
    (0, typeorm_1.Entity)()
], Workflow);
//# sourceMappingURL=workflow.entity.js.map