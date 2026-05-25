import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, ChevronLeft, ChevronRight, Quote, MessageSquareReply } from 'lucide-react';
import pb from '@/lib/pocketbaseClient';
import { Skeleton } from '@/components/ui/skeleton';

const ReviewsCarousel = () => {
  const [reviews, setReviews] = useState([]);
  const [usersMap, setUsersMap] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const records = await pb.collection('reviews').getList(1, 8, {
          sort: '-created',
          $autoCancel: false
        });
        setReviews(records.items);

        // Collect all unique user IDs (clientId + contractorId are plain text, not relations)
        const ids = [
          ...new Set([
            ...records.items.map(r => r.clientId),
            ...records.items.map(r => r.contractorId),
          ].filter(Boolean))
        ];

        if (ids.length > 0) {
          const users = await pb.collection('users').getFullList({
            filter: ids.map(id => `id = "${id}"`).join(' || '),
            $autoCancel: false
          }).catch(() => []);
          const map = {};
          users.forEach(u => { map[u.id] = u; });
          setUsersMap(map);
        }
      } catch (error) {
        console.error('Error fetching reviews:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, []);

  const nextReview = useCallback(() => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % reviews.length);
  }, [reviews.length]);

  const prevReview = useCallback(() => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + reviews.length) % reviews.length);
  }, [reviews.length]);

  useEffect(() => {
    let interval;
    if (isAutoPlaying && reviews.length > 1) {
      interval = setInterval(nextReview, 5000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isAutoPlaying, reviews.length, nextReview]);

  if (loading) {
    return (
      <div className="w-full max-w-4xl mx-auto py-12 px-4">
        <Skeleton className="h-64 w-full rounded-3xl" />
      </div>
    );
  }

  if (reviews.length === 0) {
    return null;
  }

  const currentReview = reviews[currentIndex];
  const client = usersMap[currentReview.clientId];
  const contractor = usersMap[currentReview.contractorId];

  return (
    <div
      className="w-full max-w-5xl mx-auto py-16 px-4 sm:px-6 lg:px-8"
      onMouseEnter={() => setIsAutoPlaying(false)}
      onMouseLeave={() => setIsAutoPlaying(true)}
    >
      <div className="relative bg-card border border-border rounded-3xl p-8 md:p-12 shadow-lg overflow-hidden">
        <Quote className="absolute top-8 left-8 h-24 w-24 text-primary/10 -z-10 rotate-180" />

        <div className="min-h-[200px] flex flex-col justify-center relative z-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
              className="flex flex-col items-center text-center"
            >
              <div className="flex gap-1 mb-6">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-6 w-6 ${i < currentReview.rating ? 'fill-primary text-primary' : 'fill-muted text-muted'}`}
                  />
                ))}
              </div>

              <blockquote className="text-xl md:text-2xl lg:text-3xl font-medium text-foreground leading-relaxed mb-8 max-w-3xl">
                "{currentReview.comment || 'Great service, highly recommended!'}"
              </blockquote>

              <div className="flex flex-col items-center">
                <p className="font-semibold text-lg text-foreground">
                  {client?.name || client?.email || 'Client'}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Reviewed{' '}
                  {contractor ? (
                    <Link
                      to={`/contractor/${currentReview.contractorId}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {contractor.name || contractor.email}
                    </Link>
                  ) : (
                    <span className="font-medium text-primary">a contractor</span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  {new Date(currentReview.created).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>

              {currentReview.reply && (
                <div className="mt-6 max-w-xl w-full mx-auto border-l-2 border-primary/30 pl-4 text-left">
                  <p className="text-xs font-semibold text-primary flex items-center gap-1 mb-1">
                    <MessageSquareReply className="h-3.5 w-3.5" />
                    {contractor?.name || 'Contractor'} replied
                  </p>
                  <p className="text-sm text-muted-foreground italic">{currentReview.reply}</p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {reviews.length > 1 && (
          <>
            <button
              onClick={prevReview}
              className="absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-background/80 backdrop-blur border border-border flex items-center justify-center text-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-200 hidden md:flex"
              aria-label="Previous review"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            <button
              onClick={nextReview}
              className="absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-background/80 backdrop-blur border border-border flex items-center justify-center text-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-200 hidden md:flex"
              aria-label="Next review"
            >
              <ChevronRight className="h-5 w-5" />
            </button>

            <div className="flex justify-center gap-2 mt-8">
              {reviews.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    index === currentIndex ? 'w-8 bg-primary' : 'w-2 bg-border hover:bg-primary/50'
                  }`}
                  aria-label={`Go to review ${index + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ReviewsCarousel;
