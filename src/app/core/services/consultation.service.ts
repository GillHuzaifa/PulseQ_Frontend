import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Consultation } from '../../shared/models/consultation.model';
import { QueueService } from './queue.service';
import { Token } from '../../shared/models/token.model';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})

export class ConsultationService {
  private consultationsSubject = new BehaviorSubject<Consultation[]>([]);

  consultations$ = this.consultationsSubject.asObservable();

  constructor(private queueService: QueueService) { }

  private generateId(): string {
    return `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  }

  startConsultation(tokenId: string): void {
    // mark token in queue as IN_PROGRESS
    this.queueService.updateTokenStatus(tokenId, 'IN_PROGRESS');
    const token = this.queueService.getTokenById(tokenId);
    const consultation: Consultation = {
      id: this.generateId(),
      patientId: token ? token.patientId : '',
      doctorId: token ? token.doctorId : '',
      tokenId,
      startTime: new Date(),
    } as Consultation;
    const current = this.consultationsSubject.value;
    this.consultationsSubject.next([...current, consultation]);
  }

  finishConsultation(tokenId: string, notes: string): void {

    const list = this.consultationsSubject.value.map(c => ({ ...c }));
    const idx = list.findIndex(c => c.tokenId === tokenId && (!c.endTime || c.endTime <= c.startTime));
    const now = new Date();
    const token = this.queueService.getTokenById(tokenId);
    if (idx !== -1) {
      list[idx].endTime = now;
      list[idx].notes = notes;
      if (!list[idx].patientId && token) list[idx].patientId = token.patientId;
      if (!list[idx].doctorId && token) list[idx].doctorId = token.doctorId;
    } else {

      list.push({
        id: this.generateId(),
        patientId: token ? token.patientId : '',
        doctorId: token ? token.doctorId : '',
        tokenId,
        startTime: now,
        endTime: now,
        notes
      });
    }
    this.consultationsSubject.next(list);

    this.queueService.updateTokenStatus(tokenId, 'DONE');
    this.queueService.removeToken(tokenId);
  }

  getCompletedToday(): number {
    const today = new Date();
    const isSameDay = (d1?: Date) => {
      if (!d1) return false;
      return d1.getFullYear() === today.getFullYear() && d1.getMonth() === today.getMonth() && d1.getDate() === today.getDate();
    };
    return this.consultationsSubject.value.filter(c => isSameDay(c.endTime)).length;
  }

  getAverageConsultTime(): number {
    const durations: number[] = this.consultationsSubject.value
      .filter(c => c.startTime && c.endTime)
      .map(c => ((c.endTime!.getTime() - c.startTime.getTime()) / 60000));
    if (!durations.length) return 10; // default 10 minutes
    const sum = durations.reduce((s, v) => s + v, 0);
    return Math.round(sum / durations.length);
  }

  getPatientHistory(patientId: string): Observable<Consultation[]> {
    return this.consultations$.pipe(
      map(consultations => consultations.filter(c => c.patientId === patientId))
    );
  }

  getDoctorHistory(patientId: string, doctorId: string): Observable<Consultation[]> {
    return this.consultations$.pipe(
      map(consultations => consultations.filter(c => c.patientId === patientId && c.doctorId === doctorId))
    );
  }

  getGroupedByPatient(): Observable<Map<string, Consultation[]>> {
    return this.consultations$.pipe(
      map(consultations => {
        const grouped = new Map<string, Consultation[]>();
        consultations.forEach(c => {
          const key = c.patientId;
          if (!grouped.has(key)) grouped.set(key, []);
          grouped.get(key)!.push(c);
        });
        return grouped;
      })
    );
  }
}
