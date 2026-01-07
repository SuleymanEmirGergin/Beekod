export interface AuditLog {
    id: number;
    user_id: number | null;
    user_name?: string;
    user_email?: string;
    action: string;
    entity_type: string;
    entity_id: string | null;
    details: any;
    ip_address: string | null;
    created_at: string;
}

export interface AuditLogResponse {
    items: AuditLog[];
    total: number;
}

export interface AuditLogFilters {
    limit?: number;
    offset?: number;
}
