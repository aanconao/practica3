import { MongoClient, ObjectId } from "mongodb";
import type { BookModel } from "./types.ts";
import { fromModelToBook } from "./utils.ts";

const MONGO_URL = Deno.env.get("MONGO_URL");
if (!MONGO_URL) {
  console.error("MONGO_URL is not set");
  Deno.exit(1);
}

const client = new MongoClient(MONGO_URL);
await client.connect();
console.info("Connected to MongoDB");

const db = client.db("agenda");

const booksCollection = db.collection<BookModel>("books");

const handler = async (req: Request): Promise<Response> => {
  
  const method = req.method;
  const url = new URL(req.url);
  const path = url.pathname;

  if (method === "GET") {

    if (path === "/books") {
      const booksDB = await booksCollection.find().toArray();
      const books = booksDB.map((b) => fromModelToBook(b));
      return new Response(JSON.stringify(books));
      
    } else if (path.startsWith("/books/")) {

      const id  = path.split('/')[2];
      if (!id) return new Response("No id", { status: 404 });

      const bookDB = await booksCollection.findOne({ _id: new ObjectId(id) });
      if (!bookDB) return new Response("Libro no encontrado", { status: 404 });
      const libro = await fromModelToBook(bookDB);
      return new Response(JSON.stringify(libro), { status: 201 });

    } 

  } else if (method === "POST") {
    if (path === "/books") {
      const book = await req.json();
      if (!book.title || !book.author || !book.year) {
        return new Response("Bad request", { status: 400 });
      }
      const { insertedId } = await booksCollection.insertOne({
        title: book.title,
        author: book.author,
        year: book.year
      });
      return new Response(
        JSON.stringify({
          id: insertedId,
          title: book.title,
          author: book.author,
          year: book.year,
        }),
        { status: 201 }
      );
    }

  } else if (method === "PUT") {
    if (path.startsWith("/books")) {
      
      const id  = path.split('/')[2];
      const book = await req.json();

      let update: any = {}

      if (book.title) {
        update["title"] = book.title
      }

      if (book.year) {
        update["year"] = book.year
      }

      if (book.author) {
        update["author"] = book.author
      }

      console.log(update)

      if (Object.keys(update).length === 0) {
        return new Response("Debe enviar al menos un campo para actualizar (title, author, year)", { status: 400 });
      }
      
      const { modifiedCount } = await booksCollection.updateOne(
        { _id: new ObjectId(id as string) },
        { $set: update }
      );

      if (modifiedCount === 0) {
        return new Response("Book not found", { status: 404 });
      }

      const bookDB = await booksCollection.findOne({ _id: new ObjectId(id) });
      if (!bookDB) return new Response("Libro no encontrado", { status: 404 });
      const libro = await fromModelToBook(bookDB);
      return new Response(JSON.stringify(libro), { status: 201 });

      
    }



  } else if (method === "DELETE") {

    if (path.startsWith("/books")) {
      const id  = path.split('/')[2];
     
      if (!id) return new Response("Libro no encontrado", { status: 400 });
      const { deletedCount } = await booksCollection.deleteOne({
        _id: new ObjectId(id),
      });

      if (deletedCount === 0) {
        return new Response("Libro no encontrado", { status: 404 });
      }

      return new Response("Libro borrado correctamente", { status: 200 });
    }
  }

  return new Response("endpoint not found", { status: 404 });
};

Deno.serve({ port: 3000 }, handler);