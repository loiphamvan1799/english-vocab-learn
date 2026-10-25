import { z } from 'zod';

const sourceText = z.string().transform((value) => value.trim()).refine((value) => value.length > 0);

export const topicMetadataSchema = z.object({
  id: sourceText,
  title: sourceText,
  category: sourceText.optional(),
  level: sourceText.optional(),
  lang: sourceText.optional(),
}).strict();

export const topicWordSchema = z.object({
  id: sourceText,
  imageUrl: z.string().trim().optional().nullable(),
  audioUrl: z.string().trim().optional().nullable(),
  nameVi: sourceText,
  chunk: sourceText,
  ipa: z.string().trim().optional().nullable(),
  meaningVi: sourceText,
  exampleEn: sourceText,
  exampleVi: sourceText,
}).strict();

export const parsedTopicSchema = z.object({
  topic: topicMetadataSchema.extend({ description: z.string().trim().optional() }),
  words: z.array(topicWordSchema).min(1),
  warnings: z.array(z.object({ code: z.string(), message: z.string() })),
});

export type TopicMetadataInput = z.infer<typeof topicMetadataSchema>;
export type TopicWordInput = z.infer<typeof topicWordSchema>;
export type ParsedTopic = z.infer<typeof parsedTopicSchema>;
export type ImportWarning = ParsedTopic['warnings'][number];
