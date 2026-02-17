import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, delay } from 'rxjs/operators';

export interface AuthUser {
  email: string;
  name?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly VALID_EMAIL = 'aimenduraniii@gmail.com';
  private readonly VALID_PASSWORD = '990061Ab@';

  private userSubject = new BehaviorSubject<AuthUser | null>(null);
  user$ = this.userSubject.asObservable();

  constructor() {
    // restore from localStorage if present
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem('pulseq_user') : null;
      if (raw) {
        this.userSubject.next(JSON.parse(raw));
      }
    } catch { /* ignore */ }
  }

  login(email: string, password: string): Observable<boolean> {
    return of({ email, password }).pipe(
      delay(300),
      map(creds => {
        const ok = creds.email === this.VALID_EMAIL && creds.password === this.VALID_PASSWORD;
        if (ok) {
          const user: AuthUser = { email: creds.email, name: 'Aimen Durani' };
          this.userSubject.next(user);
          try { localStorage.setItem('pulseq_user', JSON.stringify(user)); } catch { }
        }
        return ok;
      })
    );
  }

  logout(): void {
    this.userSubject.next(null);
    try { localStorage.removeItem('pulseq_user'); } catch { }
  }
}
