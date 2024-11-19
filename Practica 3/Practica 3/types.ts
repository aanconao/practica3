import { ObjectId, type OptionalId } from "mongodb";

export type BookModel = OptionalId<{
  _id: ObjectId;
  title: string;
  author: string;
  year: number;
}>;

export type Book = {
  id: string;
  title: string;
  author:string;
  year: number;
};