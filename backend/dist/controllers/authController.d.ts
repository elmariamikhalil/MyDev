import { Request, Response } from 'express';
export declare const register: (req: Request, res: Response) => Response<any, Record<string, any>> | undefined;
export declare const login: (req: Request, res: Response) => Response<any, Record<string, any>> | undefined;
export declare const getProfile: (req: any, res: Response) => Response<any, Record<string, any>> | undefined;
export declare const updateProfile: (req: any, res: Response) => Response<any, Record<string, any>> | undefined;
//# sourceMappingURL=authController.d.ts.map