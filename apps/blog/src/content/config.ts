import { defineCollection, z } from "astro:content";

const blog = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.string(),
    layout: z.enum(["default", "featured"]).optional().default("default"),
  }),
});

export const collections = {
  blog: blog,
};
