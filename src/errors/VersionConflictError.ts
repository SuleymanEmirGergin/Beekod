
import { AppError } from "./AppError.js";

export class VersionConflictError extends AppError {
    constructor(message: string = "Data has been modified by another process") {
        super(message, 409);
        this.name = "VersionConflictError";
    }
}
