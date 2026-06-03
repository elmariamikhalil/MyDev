import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
export declare const getUserStats: (req: AuthRequest, res: Response) => void;
export declare const getUserActivity: (req: AuthRequest, res: Response) => void;
export declare const getNotifications: (req: AuthRequest, res: Response) => void;
export declare const markNotificationRead: (req: AuthRequest, res: Response) => void;
export declare const getInbox: (req: AuthRequest, res: Response) => void;
export declare const getTasks: (req: AuthRequest, res: Response) => void;
export declare const createTask: (req: AuthRequest, res: Response) => void;
//# sourceMappingURL=userController.d.ts.map