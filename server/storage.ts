// We don't need persistent storage for this stateless tool,
// but we'll keep the interface standard.
import { reviews, type Review, type InsertReview } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  getReviews(pagePath: string): Promise<Review[]>;
  createReview(review: InsertReview): Promise<Review>;
}

export class DatabaseStorage implements IStorage {
  async getReviews(pagePath: string): Promise<Review[]> {
    return await db.select().from(reviews).where(eq(reviews.pagePath, pagePath));
  }

  async createReview(insertReview: InsertReview): Promise<Review> {
    const [review] = await db.insert(reviews).values(insertReview).returning();
    return review;
  }
}

export const storage = new DatabaseStorage();
