import express from "express";
import bcrypt from "bcrypt";
import jwt, { JwtPayload } from "jsonwebtoken";
import { UserService } from "../services/userService";
require("dotenv").config();

export const SECRET_KEY = `${process.env.JWT_SECRET}`;
export const TOKEN_TTL = `${process.env.ACCESS_TOKEN_TTL}m`;

class AuthController {
  static async signUp(req: express.Request, res: express.Response) {
    const { email, password } = req.body;

    const userExists = await UserService.findUserByEmail(email);
    try {
      if (Array.isArray(userExists) && userExists.length === 0) {
        const hashedPassword = await bcrypt.hash(password, 10);
        const accessToken = jwt.sign({ email }, SECRET_KEY, {
          expiresIn: TOKEN_TTL,
        });
        const refreshToken = jwt.sign({ email }, SECRET_KEY);
        const user = await UserService.registerUser(
          email,
          hashedPassword,
          accessToken,
          refreshToken
        );
        return res.status(201).json({
          success: true,
          data: {
            id: user[0].id,
            accessToken: user[0].accessToken,
            refreshToken: user[0].refreshToken,
          },
        });
      }
      if (userExists[0].email === email) {
        return res.status(409).json({ success: false, error: "User exist" });
      }
    } catch (error) {
      return res
        .status(500)
        .json({ message: "Registration failed", data: error });
    }
  }

  static async signIn(req: express.Request, res: express.Response) {
    const { email, password } = req.body;

    const user = await UserService.findUserByEmail(email);

    if (Array.isArray(user) && user.length === 0) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    const passwordMatch = await UserService.comparePasswords(
      password,
      user[0].password
    );

    if (!passwordMatch) {
      return res
        .status(401)
        .json({ success: false, error: "Authentication failed" });
    }
    const token = jwt.sign({ email }, SECRET_KEY, {
      expiresIn: TOKEN_TTL,
    });

    res.json({
      success: true,
      data: {
        id: user[0].id,
        accessToken: user[0].accessToken,
        refreshToken: user[0].refreshToken,
      },
    });
  }

  static async me(req: express.Request, res: express.Response) {
    const { authorization = "" } = req.headers;
    const [bearer, token] = authorization.split(" ");

    if (!bearer) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const accessToken = jwt.verify(token, SECRET_KEY) as JwtPayload;
      const user = await UserService.findUserByEmail(accessToken.email);
      res.json({
        success: true,
        data: { id: user[0].id, email: user[0].email },
      });
    } catch (error) {
      res.status(401).json({ success: false, message: "Invalid token" });
    }
  }
}

export default AuthController;
