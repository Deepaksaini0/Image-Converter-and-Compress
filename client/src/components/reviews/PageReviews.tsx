import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Star, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Review, InsertReview } from "@shared/schema";
import { motion, AnimatePresence } from "framer-motion";

interface PageReviewsProps {
  pagePath: string;
}

export function PageReviews({ pagePath }: PageReviewsProps) {
  const { toast } = useToast();

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [userName, setUserName] = useState("");
  const [showThankYou, setShowThankYou] = useState(false);

  /* ---------------- FETCH REVIEWS ---------------- */
  const { data: reviews = [] } = useQuery<Review[]>({
    queryKey: ["/api/reviews", pagePath || "/"],
    queryFn: async ({ queryKey }) => {
      const path = queryKey[1] as string;
      const res = await fetch(`/api/reviews?pagePath=${encodeURIComponent(path)}`);
      if (!res.ok) throw new Error("Failed to fetch reviews");
      return res.json();
    },
  });

  /* ---------------- SUBMIT REVIEW ---------------- */
  const mutation = useMutation({
    mutationFn: async (newReview: InsertReview) => {
      const res = await apiRequest("POST", "/api/reviews", newReview);
      if (!res.ok) throw new Error("Failed to submit review");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/reviews", pagePath || "/"],
      });

      setRating(0);
      setComment("");
      setUserName("");
      setShowThankYou(true);

      toast({ title: "Review submitted successfully!" });
      
      // Remove the thank you message after 5 seconds instead of reloading
      setTimeout(() => {
        setShowThankYou(false);
      }, 5000);
    },
    onError: (error: any) => {
      const message = error.response?.data?.error || "Unable to submit review";
      toast({
        title: "Submission failed",
        description: message,
        variant: "destructive",
      });
    },
  });

  const averageRating =
    reviews.length > 0
      ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length
      : 0;

  /* ---------------- SUBMIT HANDLER ---------------- */
  const handleSubmit = () => {
    if (!rating) {
      toast({
        title: "Please select a rating",
        variant: "destructive",
      });
      return;
    }

    mutation.mutate({
      pagePath: pagePath || "/",
      rating,
      comment: comment.trim(),
      userName: userName || "Anonymous",
    });
  };

  return (
    <div className="space-y-6 mt-12 pt-8 pb-12">

      {/* ---------- TOP RATING BAR ---------- */}
      <div className="flex flex-col items-center gap-2 py-8 border-y border-dashed bg-muted/5">
        <div className="flex items-center gap-4">
          <span className="text-muted-foreground font-medium">
            Rate this tool
          </span>

          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setRating(s)}
                className="focus:outline-none active:scale-95"
              >
                <Star
                  className={`w-5 h-5 ${
                    s <= Math.round(averageRating)
                      ? "fill-yellow-400 text-yellow-400"
                      : "fill-gray-300 text-gray-300"
                  }`}
                />
              </button>
            ))}
          </div>

          <div className="text-sm">
            <span className="font-bold">{averageRating.toFixed(1)}</span>
            <span className="text-muted-foreground">
              {" "} / 5 · {reviews.length} votes
            </span>
          </div>
        </div>
      </div>

      {/* ---------- FORM / THANK YOU ---------- */}
      <AnimatePresence mode="wait">
        {showThankYou ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex flex-col items-center py-12 gap-4 text-center"
          >
            <CheckCircle2 className="w-12 h-12 text-green-500" />
            <h3 className="text-xl font-bold">Thank You!</h3>
            <p className="text-muted-foreground">
              Your review has been submitted.
            </p>
          </motion.div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Add a Review</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">

              {/* STAR INPUT */}
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setRating(s)}
                  >
                    <Star
                      className={`w-8 h-8 ${
                        s <= rating
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-muted"
                      }`}
                    />
                  </button>
                ))}
              </div>

              {/* NAME */}
              <Input
                placeholder="Your name (optional)"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
              />

              {/* COMMENT */}
              <Textarea
                placeholder="Write your experience..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />

              {/* SUBMIT */}
              <Button
                onClick={handleSubmit}
                disabled={mutation.isPending}
              >
                {mutation.isPending ? "Submitting..." : "Submit Review"}
              </Button>
            </CardContent>
          </Card>
        )}
      </AnimatePresence>

      {/* ---------- REVIEWS LIST ---------- */}
      <div className="space-y-4">
        <h3 className="font-semibold text-lg">Recent Feedback</h3>

        {reviews.length === 0 ? (
          <p className="text-muted-foreground text-center py-6">
            No reviews yet.
          </p>
        ) : (
          <div className="grid gap-4">
            {[...reviews].reverse().map((review) => (
              <Card key={review.id}>
                <CardContent className="pt-6 space-y-1">
                  <div className="flex justify-between">
                    <strong>{review.userName}</strong>
                    <span className="text-xs text-muted-foreground">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-4 h-4 ${
                          s <= review.rating
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-muted"
                        }`}
                      />
                    ))}
                  </div>

                  {review.comment && (
                    <p className="text-sm">{review.comment}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
