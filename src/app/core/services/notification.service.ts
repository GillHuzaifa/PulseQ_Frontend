import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Notification } from '../../shared/models/notification.model';
import { QueueService } from './queue.service';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  notifications$ = this.notificationsSubject.asObservable();
  private autoInterval: any | null = null;

  constructor(private queueService: QueueService) { }

  private generateId(): string {
    return `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  }

  sendTokenCreated(userId: string, tokenNumber: string): void {
    const n: Notification = {
      id: this.generateId(),
      userId,
      message: `Your token ${tokenNumber} has been created.`,
      type: 'TOKEN_CREATED',
      createdAt: new Date(),
      read: false
    };
    this.notificationsSubject.next([...this.notificationsSubject.value, n]);
  }

  sendWaitUpdate(userId: string, minutes: number): void {
    const n: Notification = {
      id: this.generateId(),
      userId,
      message: `Estimated wait time: ${minutes} minutes.`,
      type: 'WAIT_UPDATE',
      createdAt: new Date(),
      read: false
    };
    this.notificationsSubject.next([...this.notificationsSubject.value, n]);
  }

  startAutoWaitUpdates(): void {
    if (this.autoInterval) return;
    // every 5 minutes
    this.autoInterval = setInterval(() => {
      this.queueService.getQueue().subscribe(queue => {
        queue.filter(t => t.status === 'WAITING').forEach(t => {
          const minutes = this.queueService.estimateWaitTime(t.doctorId);
          this.sendWaitUpdate(t.patientId, minutes);
        });
      }).unsubscribe?.();
    }, 5 * 60 * 1000);
  }
}
