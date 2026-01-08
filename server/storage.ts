// server/storage.ts

import { reviews, type Review, type InsertReview } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  getReviews(pagePath: string): Promise<Review[]>;
  createReview(review: InsertReview): Promise<Review>;
}

export class DatabaseStorage implements IStorage {
  async getReviews(pagePath: string): Promise<Review[]> {
    return await db
      .select()
      .from(reviews)
      .where(eq(reviews.pagePath, pagePath));
  }

  async createReview(insertReview: InsertReview): Promise<Review> {
    try {
      const [review] = await db
        .insert(reviews)
        .values({
          pagePath: insertReview.pagePath,
          rating: insertReview.rating,

          // 🔥 FIX: empty string → null
          comment: insertReview.comment?.trim() || null,

          // 🔥 FIX: empty name → Anonymous
          userName: insertReview.userName?.trim() || "Anonymous",
        })
        .returning();

      return review;
    } catch (error) {
      // 🔴 CRITICAL: log real DB error
      console.error("❌ Create review failed:", error);
      throw error;
    }
  }
}

export const storage = new DatabaseStorage();
