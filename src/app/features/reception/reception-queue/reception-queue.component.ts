import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ToastModule } from 'primeng/toast';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';
import { DropdownModule } from 'primeng/dropdown';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { QueueService } from '../../../core/services/queue.service';
import { Token } from '../../../shared/models/token.model';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

interface Patient {
    token: string;
    name: string;
    age: number;
    gender: string;
    reason: string;
    status?: 'pending' | 'completed' | 'skipped';
    department?: string;
    phone?: string;
    paymentStatus?: 'paid' | 'unpaid';
}

@Component({
    selector: 'app-reception-queue',
    standalone: true,
    imports: [CommonModule, FormsModule, TableModule, ButtonModule, CardModule, ToastModule, DialogModule, InputTextModule, TooltipModule, DropdownModule, ConfirmDialogModule],
    providers: [MessageService, ConfirmationService],
    templateUrl: './reception-queue.component.html',
    styleUrls: ['./reception-queue.component.css']
})
export class ReceptionQueueComponent implements OnInit, OnDestroy {
    statuses = [
        { label: 'Status', value: null, disabled: true },
        { label: 'All', value: null },
        { label: 'Pending', value: 'pending' },
        { label: 'Completed', value: 'completed' },
        { label: 'Skipped', value: 'skipped' }
    ];
    genderOptions = [
        { label: 'Male', value: 'Male' },
        { label: 'Female', value: 'Female' },
        { label: 'Other', value: 'Other' }
    ];
    departments = [
        { label: 'General Medicine', value: 'General Medicine' },
        { label: 'Cardiology', value: 'Cardiology' },
        { label: 'Pediatrics', value: 'Pediatrics' }
    ];
    paymentOptions = [
        { label: 'Payment', value: null, disabled: true },
        { label: 'All', value: null },
        { label: 'Paid', value: 'paid' },
        { label: 'Unpaid', value: 'unpaid' }
    ];
    paymentFilter: string | null = null;

    get paymentOptionsNoAll() {
        return this.paymentOptions.filter(o => o.value !== null);
    }
    tokens: Patient[] = [];
    filteredTokens: Patient[] = [];
    private destroy$ = new Subject<void>();
    selectedStatus: string | null = null;
    searchText = '';
    editVisible = false;
    viewVisible = false;
    deleteConfirmVisible = false;
    editModel: Partial<Patient> | null = null;
    viewModel: Patient | null = null;
    deleteModel: Patient | null = null;
    currentNav = 'queue';

    constructor(private messageService: MessageService, private router: Router, private confirmationService: ConfirmationService, private queueService: QueueService) { }

    ngOnInit() {
        this.queueService.getQueue()
            .pipe(takeUntil(this.destroy$))
            .subscribe(tokens => {
                // map Token model to local Patient view
                this.tokens = tokens.map((t: Token) => ({
                    token: t.tokenNumber,
                    name: t.patientName || t.patientId,
                    age: t.patientAge || 0,
                    gender: (t.patientGender as any) || 'Unknown',
                    reason: (t.reasonForVisit as any) || '',
                    status: t.status === 'WAITING' ? 'pending' : (t.status === 'DONE' ? 'completed' : (t.status === 'SKIPPED' ? 'skipped' : 'pending')),
                    department: t.department,
                    phone: t.patientPhone,
                    paymentStatus: 'unpaid'
                }));
                this.filter();
            });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    filter() {
        let results = this.tokens;
        if (this.selectedStatus) {
            results = results.filter(t => t.status === this.selectedStatus);
        }
        if (this.paymentFilter) {
            results = results.filter(t => (t.paymentStatus || 'unpaid') === this.paymentFilter);
        }
        if (this.searchText) {
            results = results.filter(t =>
                t.name.toLowerCase().includes(this.searchText.toLowerCase()) ||
                t.token.toLowerCase().includes(this.searchText.toLowerCase())
            );
        }
        this.filteredTokens = results;
    }

    onPaymentChange() {
        this.filter();
    }

    onStatusChange() {
        this.filter();
    }

    onSearchChange(text: string) {
        this.searchText = text;
        this.filter();
    }

    save() {
        // Persisted via QueueService in-memory; if you want localStorage persistence add it there.
        this.messageService.add({ severity: 'success', summary: 'Saved', detail: 'Queue saved (in-memory)' });
    }

    view(row: Patient) {
        this.viewModel = row;
        this.viewVisible = true;
    }

    edit(row: Patient) {
        this.editModel = { ...row };
        this.editVisible = true;
    }

    saveEdit() {
        if (!this.editModel) return;
        const idx = this.tokens.findIndex(t => t.token === this.editModel!.token);
        if (idx >= 0) {
            const mapped = { ...this.tokens[idx], ...(this.editModel as Patient) };
            const arr = this.queueService.getQueueSnapshot();
            const found = arr.find(x => x.tokenNumber === mapped.token);
            if (found) {
                const updated = { ...found, patientName: mapped.name, patientPhone: mapped.phone, patientAge: mapped.age, patientGender: mapped.gender };
                this.queueService.updateToken(updated as any);
                this.messageService.add({ severity: 'success', summary: 'Saved', detail: mapped.token });
            }
        }
        this.editVisible = false;
    }

    delete(row: Patient) {
        this.deleteModel = row;
        this.deleteConfirmVisible = true;
    }

    confirmDelete() {
        if (!this.deleteModel) return;
        // find token by tokenNumber and remove
        const arr2 = this.queueService.getQueueSnapshot();
        const found2 = arr2.find(x => x.tokenNumber === this.deleteModel!.token);
        if (found2) {
            this.queueService.removeToken(found2.id);
            this.messageService.add({ severity: 'error', summary: 'Entry deleted', detail: this.deleteModel!.token, life: 3000 });
        }
        this.deleteConfirmVisible = false;
    }

    reAddToken(row: Patient) {
        // find actual token by number and set to WAITING
        const arr3 = this.queueService.getQueueSnapshot();
        const found3 = arr3.find(x => x.tokenNumber === row.token);
        if (found3) {
            this.queueService.updateTokenStatus(found3.id, 'WAITING');
            this.messageService.add({ severity: 'success', summary: 'Re-added', detail: `${row.token} added back to queue`, life: 3000 });
        }
    }

    navigateTo(page: string) {
        this.currentNav = page;
        if (page === 'dashboard') {
            this.router.navigate(['/reception', 'dashboard']);
        }
    }

    signOut() {
        this.router.navigate(['/']);
    }
}
