import { Router } from "express";
import {
  createAnnouncement,
  deleteAnnouncement,
  getAnnouncementById,
  listAnnouncements,
  updateAnnouncement,
} from "../controllers/announcements.controller.ts";
import { authenticate } from "../middleware/authenticate.ts";
import {
  validateBody,
  validateParams,
  validateQuery,
} from "../middleware/validate.ts";
import { registry } from "../openapi.ts";
import {
  announcementIdParamSchema,
  announcementResponseSchema,
  createAnnouncementSchema,
  listAnnouncementsQuerySchema,
  paginatedAnnouncementsResponseSchema,
  updateAnnouncementSchema,
} from "../validators/announcements.validator.ts";
import { errorResponseSchema } from "../validators/auth.validator.ts";

const router = Router();

// 1. GET /announcements
registry.registerPath({
  method: "get",
  path: "/announcements",
  tags: ["Announcements"],
  summary: "Get paginated list of announcements with search and sorting",
  request: {
    query: listAnnouncementsQuerySchema,
  },
  responses: {
    200: {
      description: "Paginated list of announcements",
      content: {
        "application/json": {
          schema: paginatedAnnouncementsResponseSchema,
        },
      },
    },
    400: {
      description: "Invalid query parameters",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
  },
});

router.get(
  "/",
  validateQuery(listAnnouncementsQuerySchema),
  listAnnouncements,
);

// 2. GET /announcements/:id
registry.registerPath({
  method: "get",
  path: "/announcements/{id}",
  tags: ["Announcements"],
  summary: "Get single announcement details by ID",
  request: {
    params: announcementIdParamSchema,
  },
  responses: {
    200: {
      description: "Announcement details",
      content: {
        "application/json": {
          schema: announcementResponseSchema,
        },
      },
    },
    400: {
      description: "Invalid ID parameter",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    404: {
      description: "Announcement not found",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
  },
});

router.get(
  "/:id",
  validateParams(announcementIdParamSchema),
  getAnnouncementById,
);

// 3. POST /announcements
registry.registerPath({
  method: "post",
  path: "/announcements",
  tags: ["Announcements"],
  summary: "Create a new announcement",
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      required: true,
      content: {
        "application/json": {
          schema: createAnnouncementSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "Announcement created successfully",
      content: {
        "application/json": {
          schema: announcementResponseSchema,
        },
      },
    },
    400: {
      description: "Validation error",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    401: {
      description: "Unauthorized",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
  },
});

router.post(
  "/",
  authenticate,
  validateBody(createAnnouncementSchema),
  createAnnouncement,
);

// 4. PATCH /announcements/:id
registry.registerPath({
  method: "patch",
  path: "/announcements/{id}",
  tags: ["Announcements"],
  summary: "Partially update an existing announcement (owner only)",
  security: [{ bearerAuth: [] }],
  request: {
    params: announcementIdParamSchema,
    body: {
      required: true,
      content: {
        "application/json": {
          schema: updateAnnouncementSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Announcement updated successfully",
      content: {
        "application/json": {
          schema: announcementResponseSchema,
        },
      },
    },
    400: {
      description: "Validation error (e.g., empty body or invalid field)",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    401: {
      description: "Unauthorized",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    403: {
      description: "Access denied (not the owner)",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    404: {
      description: "Announcement not found",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
  },
});

router.patch(
  "/:id",
  authenticate,
  validateParams(announcementIdParamSchema),
  validateBody(updateAnnouncementSchema),
  updateAnnouncement,
);

// 5. DELETE /announcements/:id
registry.registerPath({
  method: "delete",
  path: "/announcements/{id}",
  tags: ["Announcements"],
  summary: "Delete an announcement (owner only)",
  security: [{ bearerAuth: [] }],
  request: {
    params: announcementIdParamSchema,
  },
  responses: {
    204: {
      description: "Announcement deleted successfully (No Content)",
    },
    400: {
      description: "Invalid ID parameter",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    401: {
      description: "Unauthorized",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    403: {
      description: "Access denied (not the owner)",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    404: {
      description: "Announcement not found",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
  },
});

router.delete(
  "/:id",
  authenticate,
  validateParams(announcementIdParamSchema),
  deleteAnnouncement,
);

export default router;
