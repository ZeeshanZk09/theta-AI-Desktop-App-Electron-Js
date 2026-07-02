import { z } from "zod";

export const FsOpSchema = z
  .object({
    operation: z.enum(["read-dir", "create-dir", "write-file", "read-file", "delete", "exists"]),
    path: z
      .string()
      .min(1)
      .max(4096)
      .refine((p) => !p.includes(".."), { message: "Path traversal not allowed" }),
    content: z.string().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.operation === "write-file" && typeof value.content !== "string") {
      ctx.addIssue({
        code: "custom",
        message: "content is required for write-file operation",
        path: ["content"],
      });
    }
  });

export const ExecCommandSchema = z.object({
  command: z.string().min(1).max(2000),
});

export const HttpFetchSchema = z.object({
  url: z
    .string()
    .min(1)
    .max(2048)
    .regex(/^https?:\/\//i, { message: "Invalid URL" }),
  method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"]).optional(),
  headers: z.record(z.string(), z.string()).optional(),
  body: z.any().optional(),
});

export const KillProcessSchema = z.object({
  pid: z.number().int().positive(),
});

export const SemanticWorkspaceSearchSchema = z.object({
  query: z.string().min(2).max(400),
  maxResults: z.number().int().min(1).max(30).optional(),
  maxFiles: z.number().int().min(20).max(4000).optional(),
  rootPath: z.string().min(1).max(4096).optional(),
});
