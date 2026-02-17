import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Token as TokenModel } from '../../shared/models/token.model';
export type Token = TokenModel;

@Injectable({
  providedIn: 'root'
})
export class QueueService {
  private activeTokenSubject = new BehaviorSubject<Token | null>(null);
  public activeToken$ = this.activeTokenSubject.asObservable();
  private queueSubject = new BehaviorSubject<Token[]>([]);
  queue$ = this.queueSubject.asObservable();

  private storageKey = 'pulseq_queue_v1';

  constructor() {
    this.loadFromStorage();

    // changes applied in localStorage
    this.queueSubject.subscribe(list => {
      try {
        window.localStorage.setItem(this.storageKey, JSON.stringify(list));
      } catch (e) {
        // ignore 
      }
    });
  }

  private loadFromStorage(): void {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return;
      const raw = window.localStorage.getItem(this.storageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as any[];

      const revived: Token[] = parsed.map(p => ({
        ...p,
        createdAt: p.createdAt ? new Date(p.createdAt) : new Date(),
        startTime: p.startTime ? new Date(p.startTime) : undefined,
        endTime: p.endTime ? new Date(p.endTime) : undefined
      }));
      this.queueSubject.next(revived);
    } catch (e) {
      // ignore
    }
  }

  getQueue(): Observable<Token[]> {
    return this.queue$;
  }

  addToken(token: Token): void {
    const now = new Date();
    const item: Token = {
      ...token,
      createdAt: token.createdAt || now,
      status: token.status || 'WAITING'
    } as Token;
    const current = this.queueSubject.value;
    this.queueSubject.next([...current, item]);
    this.activeTokenSubject.next(item);
  }

  /** Creates and adds a token */
  addTokenFor(patientId: string, doctorId: string | null, department: string, extras?: Partial<Token>): Token {
    const now = new Date();
    const tokenNumber = this.generateTokenNumber();
    const id = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const item: Token = {
      id,
      tokenNumber,
      patientId,
      doctorId: doctorId || '',
      department,
      status: 'WAITING',
      createdAt: now,
      ...extras
    } as Token;
    const current = this.queueSubject.value;
    this.queueSubject.next([...current, item]);
    this.activeTokenSubject.next(item);
    return item;
  }

  updateTokenStatus(tokenId: string, status: Token['status']): void {
    const updated = this.queueSubject.value.map(t => {
      if (t.id === tokenId) {
        const copy: Token = { ...t, status };
        if (status === 'IN_PROGRESS') copy.startTime = copy.startTime || new Date();
        if (status === 'DONE') copy.endTime = copy.endTime || new Date();
        return copy;
      }
      return t;
    });
    this.queueSubject.next(updated);
    // Keep activeToken in sync
    const active = this.activeTokenSubject.value;
    if (active && active.id === tokenId) {
      this.activeTokenSubject.next(updated.find(u => u.id === tokenId) || null);
    }
  }

  updateToken(token: Token): void {
    const updated = this.queueSubject.value.map(t => t.id === token.id ? { ...t, ...token } : t);
    this.queueSubject.next(updated);
    const active = this.activeTokenSubject.value;
    if (active && active.id === token.id) {
      this.activeTokenSubject.next(updated.find(u => u.id === token.id) || null);
    }
  }

  removeToken(tokenId: string): void {
    const filtered = this.queueSubject.value.filter(t => t.id !== tokenId);
    this.queueSubject.next(filtered);
    const active = this.activeTokenSubject.value;
    if (active && active.id === tokenId) {
      this.activeTokenSubject.next(null);
    }
  }
  createToken(token: Token): Token {
    this.addToken(token);
    this.activeTokenSubject.next(token);
    return this.activeTokenSubject.value!;
  }

  deleteToken(): void {
    const active = this.activeTokenSubject.value;
    if (active) {
      this.removeToken(active.id);
    }
    this.activeTokenSubject.next(null);
  }

  generateTokenNumber(): string {
    // Format: A-001, A-002 
    const existing = this.queueSubject.value.map(t => t.tokenNumber).filter(Boolean) as string[];
    const numbers = existing.map(n => {
      const m = n.match(/A-(\d+)/i);
      return m ? parseInt(m[1], 10) : 0;
    });
    const max = numbers.length ? Math.max(...numbers) : 0;
    const next = max + 1;
    return `A-${String(next).padStart(3, '0')}`;
  }

  estimateWaitTime(doctorId: string): number {
    const waitingForDoctor = this.queueSubject.value.filter(t => t.doctorId === doctorId && t.status === 'WAITING');
    // default: 10 minutes per waiting patient
    const avgPerPatient = 10;
    return waitingForDoctor.length * avgPerPatient;
  }

  getCurrentlyServing(doctorId: string): Token | null {
    return this.queueSubject.value.find(t => t.doctorId === doctorId && t.status === 'IN_PROGRESS') || null;
  }

  getWaitingCount(): number {
    return this.queueSubject.value.filter(t => t.status === 'WAITING').length;
  }

  getTokenById(tokenId: string): Token | undefined {
    return this.queueSubject.value.find(t => t.id === tokenId);
  }

  // Return current queue snapshot (synchronous)
  getQueueSnapshot(): Token[] {
    return this.queueSubject.value;
  }
}
