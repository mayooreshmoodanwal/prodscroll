import { z } from "zod";
import { eventNames } from "@productscroll/analytics";
export const idParams = z.object({ id: z.string().min(1).max(80) });
export const pageQuery = z.object({
  cursor: z.string().max(2000).optional(),
  limit: z.coerce.number().int().min(1).max(40).default(15),
});
export const eventTypeSchema = z.enum(eventNames);
