import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import { logger } from "../logger.js";
import { config } from "../config.js";

class SocketService {
    private io: Server | null = null;
    private static instance: SocketService;

    private constructor() { }

    public static getInstance(): SocketService {
        if (!SocketService.instance) {
            SocketService.instance = new SocketService();
        }
        return SocketService.instance;
    }

    public initialize(httpServer: HttpServer): void {
        if (this.io) {
            logger.warn("socket.already_initialized");
            return;
        }

        this.io = new Server(httpServer, {
            cors: {
                origin: ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:5174", "http://127.0.0.1:5174", ...(config.security?.cors?.origins || [])],
                methods: ["GET", "POST"],
                credentials: true
            },
            path: "/socket.io", // Default path
        });

        this.io.on("connection", (socket: Socket) => {
            logger.info("socket.connected", { id: socket.id });

            // Join a default room or handle authentication here if strictly needed
            // Currently, we trust the connection or can add middleware later

            socket.on("disconnect", (reason) => {
                logger.info("socket.disconnected", { id: socket.id, reason });
            });
        });

        logger.info("socket.service_initialized");
    }

    public emit(event: string, data: any, room?: string): void {
        if (!this.io) {
            logger.warn("socket.emit_failed_no_io", { event });
            return;
        }

        try {
            if (room) {
                this.io.to(room).emit(event, data);
            } else {
                this.io.emit(event, data);
            }
            logger.debug("socket.emitted", { event, room });
        } catch (error) {
            logger.error("socket.emit_error", { event, error });
        }
    }
}

export const socketService = SocketService.getInstance();
