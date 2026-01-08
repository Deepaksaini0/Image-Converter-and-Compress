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

  const { data: reviews = [] } = useQuery<Review[]>({
    queryKey: ["/api/reviews", pagePath || "/"],
    queryFn: async ({ queryKey }) => {
      const path = queryKey[1] as string;
      const res = await fetch(`/api/reviews?pagePath=${encodeURIComponent(path)}`);
      if (!res.ok) throw new Error("Failed to fetch reviews");
      return res.json();
    },
  });

  const mutation = useMutation({
    mutationFn: async (newReview: InsertReview) => {
      const res = await apiRequest("POST", "/api/reviews", newReview);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reviews", pagePath || "/"] });
      setRating(0);
      setComment("");
      setUserName("");
      toast({ title: "Review submitted successfully!" });
      // Reload to reflect changes as requested by user
      window.location.reload();
    },
  });

  const averageRating = reviews.length > 0
    ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length
    : 0;

  return (
    <div className="space-y-6 mt-12 pt-8 pb-12">
      <div className="flex flex-col items-center justify-center gap-2 py-8 border-y border-dashed bg-muted/5">
        <div className="flex items-center gap-4">
          <span className="text-muted-foreground font-medium whitespace-nowrap">Rate this tool</span>
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((s) => (
              <button
                key={s}
                onClick={() => setRating(s)}
                className="focus:outline-none transition-transform active:scale-95"
                type="button"
                data-testid={`button-rate-${s}`}
              >
                <Star
                  key={s}
                  className={`w-5 h-5 ${s <= Math.round(averageRating) ? "fill-yellow-400 text-yellow-400" : "fill-[#d1d5db] text-[#d1d5db]"}`}
                />
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1.5 text-sm whitespace-nowrap">
            <span className="font-bold text-base">{averageRating.toFixed(1)}</span>
            <span className="text-muted-foreground">/ 5 - {reviews.length} votes</span>
          </div>
        </div>
      </div>

      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Add a Review</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">Your Rating:</span>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  onClick={() => setRating(s)}
                  className="focus:outline-none transition-transform active:scale-95"
                  type="button"
                  data-testid={`button-rate-${s}`}
                >
                  <Star
                    className={`w-8 h-8 transition-colors ${s <= rating ? "fill-yellow-400 text-yellow-400" : "text-muted hover:text-yellow-400/50"}`}
                  />
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Name</label>
              <Input
                placeholder="Anonymous"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                data-testid="input-username"
                className="bg-background"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Comment</label>
            <Textarea
              placeholder="How was your experience using this tool?"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              data-testid="textarea-comment"
              className="bg-background min-h-[100px]"
            />
          </div>
          <Button
            onClick={() => mutation.mutate({ pagePath: pagePath || "/", rating, comment, userName: userName || "Anonymous" })}
            disabled={rating === 0 || mutation.isPending}
            className="w-full md:w-auto px-8"
            data-testid="button-submit-review"
          >
            {mutation.isPending ? "Submitting..." : "Submit Review"}
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h3 className="font-semibold text-lg">Recent Feedback</h3>
        {reviews.length === 0 ? (
          <p className="text-center py-8 text-muted-foreground border rounded-lg border-dashed">
            No reviews yet. Be the first to share your thoughts!
          </p>
        ) : (
          <div className="grid gap-4">
            {[...reviews].reverse().map((review) => (
              <Card key={review.id} className="hover:border-primary/30 transition-colors">
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold">{review.userName}</span>
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`w-3.5 h-3.5 ${s <= review.rating ? "fill-yellow-400 text-yellow-400" : "text-muted"}`}
                            />
                          ))}
                        </div>
                      </div>
                      {review.comment && (
                        <p className="text-sm text-foreground/90 leading-relaxed">
                          {review.comment}
                        </p>
                      )}
                    </div>
                    <time className="text-[10px] uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                      {new Date(review.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </time>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
