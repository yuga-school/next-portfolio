import { Category } from "./Category";
import { CoverImage } from "./CoverImage";
import {text} from "./text"
export type Post = {
    id: string;
    title: string;
    createdAt: string;
    repository: string;
    app_url: string;
    categories: Category[];
    article: (CoverImage | text)[];
};