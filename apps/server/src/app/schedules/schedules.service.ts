import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Schedule } from './entities/schedule.entity';
import { IsString, IsOptional, IsBoolean, IsObject } from 'class-validator';
import { WorkflowsService } from '../workflows/workflows.service';
import { CronJob } from 'cron';

class CreateScheduleDto {
  @IsString()
  workflowId!: string;

  @IsString()
  name!: string;

  @IsString()
  cronExpression!: string;

  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsObject()
  config?: Record<string, any>;
}

@Injectable()
export class SchedulesService {
  private jobs: Map<string, CronJob> = new Map();

  constructor(
    @InjectRepository(Schedule)
    private scheduleRepo: Repository<Schedule>,
    private workflowsService: WorkflowsService,
  ) {}

  async findAll(): Promise<Schedule[]> {
    return this.scheduleRepo.find({
      relations: ['workflow'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Schedule> {
    const schedule = await this.scheduleRepo.findOne({
      where: { id },
      relations: ['workflow'],
    });
    if (!schedule) {
      throw new NotFoundException(`Schedule ${id} not found`);
    }
    return schedule;
  }

  async create(dto: CreateScheduleDto): Promise<Schedule> {
    const schedule = this.scheduleRepo.create(dto);
    const saved = await this.scheduleRepo.save(schedule);
    if (saved.enabled) {
      this.startJob(saved);
    }
    return saved;
  }

  async update(id: string, dto: Partial<CreateScheduleDto>): Promise<Schedule> {
    const schedule = await this.findOne(id);
    Object.assign(schedule, dto);
    const saved = await this.scheduleRepo.save(schedule);
    
    this.stopJob(id);
    if (saved.enabled) {
      this.startJob(saved);
    }
    return saved;
  }

  async delete(id: string): Promise<void> {
    const schedule = await this.findOne(id);
    this.stopJob(id);
    await this.scheduleRepo.delete(id);
  }

  async trigger(id: string): Promise<{ message: string }> {
    const schedule = await this.findOne(id);
    console.log(`Manual trigger for schedule: ${schedule.name}`);
    return { message: 'Triggered' };
  }

  private startJob(schedule: Schedule) {
    const job = new CronJob(schedule.cronExpression, async () => {
      console.log(`Executing scheduled workflow: ${schedule.name}`);
    });
    job.start();
    this.jobs.set(schedule.id, job);
  }

  private stopJob(id: string) {
    const job = this.jobs.get(id);
    if (job) {
      job.stop();
      this.jobs.delete(id);
    }
  }
}

export { CreateScheduleDto };