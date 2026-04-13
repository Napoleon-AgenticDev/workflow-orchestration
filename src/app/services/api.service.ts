import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Workflow, Execution, Schedule, WorkflowNode, WorkflowEdge } from '../models/workflow.model';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private baseUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  // Workflows
  getWorkflows(): Observable<Workflow[]> {
    return this.http.get<Workflow[]>(`${this.baseUrl}/workflows`);
  }

  getWorkflow(id: string): Observable<Workflow> {
    return this.http.get<Workflow>(`${this.baseUrl}/workflows/${id}`);
  }

  createWorkflow(workflow: Partial<Workflow>): Observable<Workflow> {
    return this.http.post<Workflow>(`${this.baseUrl}/workflows`, workflow);
  }

  updateWorkflow(id: string, workflow: Partial<Workflow>): Observable<Workflow> {
    return this.http.put<Workflow>(`${this.baseUrl}/workflows/${id}`, workflow);
  }

  deleteWorkflow(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/workflows/${id}`);
  }

  updateWorkflowNodes(workflowId: string, nodes: WorkflowNode[], edges: WorkflowEdge[]): Observable<Workflow> {
    return this.http.put<Workflow>(`${this.baseUrl}/workflows/${workflowId}/nodes`, { nodes, edges });
  }

  // Executions
  getExecutions(workflowId?: string): Observable<Execution[]> {
    const url = workflowId ? `${this.baseUrl}/executions?workflowId=${workflowId}` : `${this.baseUrl}/executions`;
    return this.http.get<Execution[]>(url);
  }

  getExecution(id: string): Observable<Execution> {
    return this.http.get<Execution>(`${this.baseUrl}/executions/${id}`);
  }

  executeWorkflow(workflowId: string, input?: Record<string, any>): Observable<Execution> {
    return this.http.post<Execution>(`${this.baseUrl}/executions/execute`, { workflowId, input });
  }

  // Schedules
  getSchedules(): Observable<Schedule[]> {
    return this.http.get<Schedule[]>(`${this.baseUrl}/schedules`);
  }

  getSchedule(id: string): Observable<Schedule> {
    return this.http.get<Schedule>(`${this.baseUrl}/schedules/${id}`);
  }

  createSchedule(schedule: Partial<Schedule>): Observable<Schedule> {
    return this.http.post<Schedule>(`${this.baseUrl}/schedules`, schedule);
  }

  updateSchedule(id: string, schedule: Partial<Schedule>): Observable<Schedule> {
    return this.http.put<Schedule>(`${this.baseUrl}/schedules/${id}`, schedule);
  }

  deleteSchedule(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/schedules/${id}`);
  }

  triggerSchedule(id: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.baseUrl}/schedules/${id}/trigger`, {});
  }
}