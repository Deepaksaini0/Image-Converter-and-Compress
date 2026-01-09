// server/storage.ts

import { reviews, type Review, type InsertReview } from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";

export interface IStorage {
  getReviews(pagePath: string): Promise<Review[]>;
  createReview(review: InsertReview): Promise<Review>;
  hasReviewed(pagePath: string, ipAddress: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  async getReviews(pagePath: string): Promise<Review[]> {
    return await db
      .select()
      .from(reviews)
      .where(eq(reviews.pagePath, pagePath));
  }

  async hasReviewed(pagePath: string, ipAddress: string): Promise<boolean> {
    const existing = await db
      .select()
      .from(reviews)
      .where(
        and(
          eq(reviews.pagePath, pagePath),
          eq(reviews.ipAddress, ipAddress)
        )
      )
      .limit(1);
    return existing.length > 0;
  }

  async createReview(insertReview: InsertReview): Promise<Review> {
    try {
      const [review] = await db
        .insert(reviews)
        .values({
          pagePath: insertReview.pagePath,
          rating: insertReview.rating,
          ipAddress: insertReview.ipAddress,
          comment: insertReview.comment?.trim() || null,
          userName: insertReview.userName?.trim() || "Anonymous",
        })
        .returning();

      return review;
    } catch (error) {
      console.error("❌ Create review failed:", error);
      throw error;
    }
  }
}

export const storage = new DatabaseStorage();
