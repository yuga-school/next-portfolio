import { Category } from "@prisma/client/edge";
import { CoverImage } from "./CoverImage";
import {text} from "./text"
export type PostApiResponse = {
  id: string;
  title: string;
  repository: string;
  app_url: string;
  createdAt: string;
  article: (CoverImage | text)[];
  categories: Category[];
};