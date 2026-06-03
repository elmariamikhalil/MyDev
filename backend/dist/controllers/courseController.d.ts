import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
export declare const getCourses: (req: AuthRequest, res: Response) => void;
export declare const getCourseDetails: (req: AuthRequest, res: Response) => void;
export declare const getCourseProgress: (req: AuthRequest, res: Response) => void;
export declare const enrollInCourse: (req: AuthRequest, res: Response) => void;
export declare const search: (req: AuthRequest, res: Response) => void;
export declare const getMentors: (req: AuthRequest, res: Response) => void;
export declare const followMentor: (req: AuthRequest, res: Response) => void;
export declare const getLesson: (req: AuthRequest, res: Response) => void;
export declare const submitQuiz: (req: AuthRequest, res: Response) => Response<any, Record<string, any>> | undefined;
export declare const completeLesson: (req: AuthRequest, res: Response) => void;
export declare const getCertificate: (req: AuthRequest, res: Response) => void;
//# sourceMappingURL=courseController.d.ts.map