export interface Doctor {
    id: string;
    name: string;
    department: string;
    room?: string;
    isAvailable: boolean;
    avgConsultTime?: number;
}
