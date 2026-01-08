import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Review, InsertReview } from "@shared/schema";

interface PageReviewsProps {
  pagePath: string;
}

export function PageReviews({ pagePath }: PageReviewsProps) {
  const { toast } = useToast();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [userName, setUserName] = useState("");

  const { data: reviews = [], isLoading } = useQuery<Review[]>({
    queryKey: ["/api/reviews", { pagePath }],
  });

  const mutation = useMutation({
    mutationFn: async (newReview: InsertReview) => {
      const res = await apiRequest("POST", "/api/reviews", newReview);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reviews", { pagePath }] });
      setRating(0);
      setComment("");
      setUserName("");
      toast({ title: "Review submitted successfully!" });
    },
  });

  const averageRating = reviews.length > 0
    ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length
    : 0;

  return (
    <div className="space-y-6 mt-12 border-t pt-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Reviews</h2>
        <div className="flex items-center gap-2">
          <div className="flex">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                className={`w-5 h-5 ${s <= averageRating ? "fill-primary text-primary" : "text-muted"}`}
              />
            ))}
          </div>
          <span className="font-medium">{averageRating.toFixed(1)} / 5.0</span>
          <span className="text-muted-foreground">({reviews.length} reviews)</span>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Write a Review</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((s) => (
              <button
                key={s}
                onClick={() => setRating(s)}
                className="focus:outline-none"
                data-testid={`button-rate-${s}`}
              >
                <Star
                  className={`w-8 h-8 transition-colors ${s <= rating ? "fill-primary text-primary" : "text-muted hover:text-primary"}`}
                />
              </button>
            ))}
          </div>
          <Input
            placeholder="Your Name (Optional)"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            data-testid="input-username"
          />
          <Textarea
            placeholder="Share your experience..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            data-testid="textarea-comment"
          />
          <Button
            onClick={() => mutation.mutate({ pagePath, rating, comment, userName })}
            disabled={rating === 0 || mutation.isPending}
            className="w-full"
            data-testid="button-submit-review"
          >
            Submit Review
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {reviews.map((review) => (
          <Card key={review.id}>
            <CardContent className="pt-6">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <span className="font-semibold block">{review.userName}</span>
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-4 h-4 ${s <= review.rating ? "fill-primary text-primary" : "text-muted"}`}
                      />
                    ))}
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(review.createdAt).toLocaleDateString()}
                </span>
              </div>
              {review.comment && <p className="text-muted-foreground">{review.comment}</p>}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
