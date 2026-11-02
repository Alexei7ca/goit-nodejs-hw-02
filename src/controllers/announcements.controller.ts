import type { Request, Response } from "express";
import prisma from "../../prisma/client.ts";
import type {
  CreateAnnouncementInput,
  ListAnnouncementsQuery,
  UpdateAnnouncementInput,
} from "../validators/announcements.validator.ts";

const userSelect = {
  id: true,
  username: true,
  email: true,
  name: true,
};

const announcementSelect = {
  id: true,
  title: true,
  description: true,
  price: true,
  category: true,
  createdAt: true,
  updatedAt: true,
  user: {
    select: userSelect,
  },
};

export async function listAnnouncements(req: Request, res: Response) {
  const query = (res.locals.query ?? req.query) as ListAnnouncementsQuery;
  const search = query.search?.trim();
  const sort = query.sort ?? "newest";
  const page = Number(query.page ?? 1);
  const perPage = 10;

  const where = search
    ? {
        title: {
          contains: search,
          mode: "insensitive" as const,
        },
      }
    : {};

  const orderBy = {
    createdAt: sort === "oldest" ? ("asc" as const) : ("desc" as const),
  };

  const skip = (page - 1) * perPage;

  const [data, total] = await Promise.all([
    prisma.announcement.findMany({
      where,
      orderBy,
      skip,
      take: perPage,
      select: announcementSelect,
    }),
    prisma.announcement.count({ where }),
  ]);

  const totalPages = total === 0 ? 0 : Math.ceil(total / perPage);

  return res.status(200).json({
    data,
    pagination: {
      total,
      page,
      totalPages,
      perPage,
    },
  });
}

export async function getAnnouncementById(req: Request, res: Response) {
  const id = Number(res.locals.params?.id ?? req.params.id);

  const announcement = await prisma.announcement.findUnique({
    where: { id },
    select: announcementSelect,
  });

  if (!announcement) {
    return res.status(404).json({ error: "Announcement not found" });
  }

  return res.status(200).json(announcement);
}

export async function createAnnouncement(req: Request, res: Response) {
  const { title, description, price, category } =
    req.body as CreateAnnouncementInput;
  const userId = req.user!.sub;

  const announcement = await prisma.announcement.create({
    data: {
      title,
      description,
      price,
      category,
      userId,
    },
    select: announcementSelect,
  });

  return res.status(201).json(announcement);
}

export async function updateAnnouncement(req: Request, res: Response) {
  const id = Number(res.locals.params?.id ?? req.params.id);
  const data = req.body as UpdateAnnouncementInput;
  const currentUserId = req.user!.sub;

  const existing = await prisma.announcement.findUnique({
    where: { id },
  });

  if (!existing) {
    return res.status(404).json({ error: "Announcement not found" });
  }

  if (existing.userId !== currentUserId) {
    return res.status(403).json({ error: "Access denied" });
  }

  const updated = await prisma.announcement.update({
    where: { id },
    data,
    select: announcementSelect,
  });

  return res.status(200).json(updated);
}

export async function deleteAnnouncement(req: Request, res: Response) {
  const id = Number(res.locals.params?.id ?? req.params.id);
  const currentUserId = req.user!.sub;

  const existing = await prisma.announcement.findUnique({
    where: { id },
  });

  if (!existing) {
    return res.status(404).json({ error: "Announcement not found" });
  }

  if (existing.userId !== currentUserId) {
    return res.status(403).json({ error: "Access denied" });
  }

  await prisma.announcement.delete({
    where: { id },
  });

  return res.status(204).end();
}
