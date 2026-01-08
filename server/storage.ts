// We don't need persistent storage for this stateless tool,
// but we'll keep the interface standard.
import { reviews, type Review, type InsertReview } from "@shared/schema";

export interface IStorage {
  getReviews(pagePath: string): Promise<Review[]>;
  createReview(review: InsertReview): Promise<Review>;
}

export class MemStorage implements IStorage {
  private reviews: Review[] = [];
  private currentId = 1;

  async getReviews(pagePath: string): Promise<Review[]> {
    return this.reviews.filter(r => r.pagePath === pagePath);
  }

  async createReview(insertReview: InsertReview): Promise<Review> {
    const review: Review = {
      ...insertReview,
      id: this.currentId++,
      createdAt: new Date(),
      userName: insertReview.userName || "Anonymous",
      comment: insertReview.comment || null
    };
    this.reviews.push(review);
    return review;
  }
}

export const storage = new MemStorage();
