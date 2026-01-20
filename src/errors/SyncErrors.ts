
import { UnrecoverableError } from 'bullmq';

export class SyncError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'SyncError';
    }
}

export class PermanentSyncError extends UnrecoverableError {
    constructor(message: string) {
        super(message);
        this.name = 'PermanentSyncError';
    }
}

export class TransientSyncError extends SyncError {
    constructor(message: string) {
        super(message);
        this.name = 'TransientSyncError';
    }
}
