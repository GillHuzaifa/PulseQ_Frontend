export interface Consultation {
    id: string;
    patientId: string;
    patientName?: string;
    doctorId: string;
    doctorName?: string;
    tokenId: string;
    tokenNumber?: string;
    reason?: string;
    phone?: string;
    notes?: string;
    startTime: Date;
    endTime?: Date;
}
