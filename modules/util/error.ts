/** an {@link Error} with a `status` code */
export class ApiError extends Error {
    status: number;

    constructor(message: string, status: number, options?: ErrorOptions) {
        super(message, options);
        this.status = status;
    }
}
