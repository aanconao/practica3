import type { BookModel, Book} from "./types.ts";

export const fromModelToBook = (model: BookModel): Book => ({
  id: model._id!.toString(),
  title: model.title,
  author: model.author,
  year: model.year
});