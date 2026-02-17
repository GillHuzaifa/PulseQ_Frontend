import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { ConsultationService } from '../../../core/services/consultation.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

interface VisitDetail {
  id: string;
  doctor: string;
  specialty?: string;
  token?: string;
  date?: string;
  time?: string;
  patientName?: string;
  ageGender?: string;
  phone?: string;
  reason?: string;
  notes?: string;
  status?: string;
}

@Component({
  selector: 'app-history-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './history-detail.component.html',
  styleUrl: './history-detail.component.css'
})
export class HistoryDetailComponent implements OnInit, OnDestroy {

  visit?: VisitDetail;
  private destroy$ = new Subject<void>();

  constructor(private route: ActivatedRoute, private consultationService: ConsultationService) { }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;
    this.consultationService.consultations$
      .pipe(takeUntil(this.destroy$))
      .subscribe(list => {
        const found = list.find(c => c.id === id);
        if (found) {
          this.visit = {
            id: found.id,
            doctor: found.doctorName || found.doctorId,
            token: found.tokenNumber,
            date: found.startTime ? found.startTime.toDateString() : undefined,
            time: found.startTime ? found.startTime.toLocaleTimeString() : undefined,
            patientName: found.patientName,
            reason: found.reason,
            notes: found.notes,
            status: found.endTime ? 'Completed' : 'In progress'
          };
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

}
