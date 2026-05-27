import "express";

declare module "express" {
  interface Request {
    user?: {
      sub: number;
      userName: string;
      email?: string;
    };
  }
}
