import crypto from "crypto";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import type { Request, Response } from "express";
import prisma from "../../prisma/client.ts";
import type {
  LoginInput,
  RefreshInput,
  RegisterInput,
} from "../validators/auth.validator.ts";

function generateTokens(userId: number, username: string) {
  const secret = process.env.JWT_SECRET!;
  const accessToken = jwt.sign({ sub: userId, username }, secret, {
    expiresIn: "15m",
  });
  const refreshToken = jwt.sign(
    { sub: userId, username, jti: crypto.randomUUID() },
    secret,
    {
      expiresIn: "7d",
    },
  );
  return { accessToken, refreshToken };
}

export async function register(req: Request, res: Response) {
  const { username, email, password, name } = req.body as RegisterInput;

  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [{ username }, { email }],
    },
  });

  if (existingUser) {
    return res.status(409).json({ error: "Username or email already taken" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      username,
      email,
      password: hashedPassword,
      name,
    },
    select: {
      id: true,
      username: true,
      email: true,
      name: true,
    },
  });

  const { accessToken, refreshToken } = generateTokens(user.id, user.username);

  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
    },
  });

  return res.status(201).json({
    user,
    accessToken,
    refreshToken,
  });
}

export async function login(req: Request, res: Response) {
  const { username, password } = req.body as LoginInput;

  const user = await prisma.user.findUnique({
    where: { username },
  });

  if (!user) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const passwordValid = await bcrypt.compare(password, user.password);
  if (!passwordValid) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  await prisma.refreshToken.deleteMany({
    where: { userId: user.id },
  });

  const { accessToken, refreshToken } = generateTokens(user.id, user.username);

  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
    },
  });

  return res.status(200).json({
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      name: user.name,
    },
    accessToken,
    refreshToken,
  });
}

export async function refresh(req: Request, res: Response) {
  const { refreshToken } = req.body as RefreshInput;

  let decoded: { sub: number | string; username: string };
  try {
    const secret = process.env.JWT_SECRET!;
    decoded = jwt.verify(refreshToken, secret) as unknown as {
      sub: number | string;
      username: string;
    };
  } catch {
    return res.status(401).json({ error: "Invalid or expired refresh token" });
  }

  const storedToken = await prisma.refreshToken.findUnique({
    where: { token: refreshToken },
  });

  if (!storedToken) {
    return res.status(401).json({ error: "Invalid or expired refresh token" });
  }

  const userId = Number(decoded.sub);
  const username = String(decoded.username);

  // Token rotation: delete old refresh token and create a new token pair
  await prisma.refreshToken.deleteMany({
    where: { id: storedToken.id },
  });

  const tokens = generateTokens(userId, username);

  await prisma.refreshToken.create({
    data: {
      token: tokens.refreshToken,
      userId,
    },
  });

  return res.status(200).json({
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
  });
}

export async function logout(req: Request, res: Response) {
  const userId = req.user!.sub;

  await prisma.refreshToken.deleteMany({
    where: { userId },
  });

  return res.status(204).end();
}

export async function getMe(req: Request, res: Response) {
  const userId = req.user!.sub;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      email: true,
      name: true,
      createdAt: true,
    },
  });

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  return res.status(200).json(user);
}
