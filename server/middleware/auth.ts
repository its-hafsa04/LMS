import { Request, Response, NextFunction } from "express";
import { CatchAsyncError } from "./catchAsyncErrors";
import ErrorHandler from "../utils/ErrorHandler";
import jwt, { JwtPayload } from "jsonwebtoken";
import { redis } from "../utils/redis";
import { accessTokenOptions, refreshTokenOptions } from "../utils/jwt";

// Authentication Check (User)
export const isAuthenticated = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    // Skip verification if already authenticated by previous middleware
    if (req.user) {
      return next();
    }

    const access_token = req.cookies.access_token;

    if (!access_token) {
      return next(
        new ErrorHandler(
          "You need authorization for this request! Please login",
          400
        )
      );
    }

    try {
      const decoded = jwt.verify(
        access_token,
        process.env.ACCESS_TOKEN as string
      ) as JwtPayload;

      const user = await redis.get(decoded.id);
      if (!user) {
        return next(
          new ErrorHandler("Please login to access this resource", 400)
        );
      }
      req.user = JSON.parse(user);
      next();
    } catch (error: any) {
      // More specific error for debugging
      return next(
        new ErrorHandler(`Token verification failed: ${error.message}`, 401)
      );
    }
  }
);

// Role Authorization
export const authorizeRoles = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!roles.includes(req.user?.role || "")) {
      return next(
        new ErrorHandler(
          `${req.user?.role} role is not authorized to access this resource`,
          403
        )
      );
    }
    next();
  };
};

// Refresh Access Token when needed
export const updateAccessToken = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const access_token = req.cookies.access_token as string | undefined;
      const refresh_token = req.cookies.refresh_token as string | undefined;

      const validateAccessToken = async () => {
        if (!access_token) return false;
        try {
          const decoded = jwt.verify(
            access_token,
            process.env.ACCESS_TOKEN as string
          ) as JwtPayload;
          const session = await redis.get(decoded.id as string);
          if (!session) return false;

          req.user = JSON.parse(session);
          return true;
        } catch (_error) {
          return false;
        }
      };

      if (await validateAccessToken()) {
        return next();
      }

      if (!refresh_token) {
        return next(new ErrorHandler("No refresh token found", 401));
      }

      const decoded = jwt.verify(
        refresh_token,
        process.env.REFRESH_TOKEN as string
      ) as JwtPayload;

      if (!decoded || !decoded.id) {
        return next(
          new ErrorHandler("Please login for access to this resource", 401)
        );
      }

      const session = await redis.get(decoded.id as string);
      if (!session) {
        return next(
          new ErrorHandler("Please login for access to this resource", 401)
        );
      }

      const user = JSON.parse(session);

      const newAccessToken = jwt.sign(
        { id: user._id },
        process.env.ACCESS_TOKEN as string,
        {
          expiresIn: "5m",
        }
      );

      const newRefreshToken = jwt.sign(
        { id: user._id },
        process.env.REFRESH_TOKEN as string,
        {
          expiresIn: "3d",
        }
      );

      req.user = user;
      res.cookie("access_token", newAccessToken, accessTokenOptions);
      res.cookie("refresh_token", newRefreshToken, refreshTokenOptions);

      req.cookies.access_token = newAccessToken;
      req.cookies.refresh_token = newRefreshToken;

      await redis.set(user._id as string, JSON.stringify(user), "EX", 604800);

      next();
    } catch (error: any) {
      return next(
        new ErrorHandler(`Token refresh error: ${error.message}`, 401)
      );
    }
  }
);
