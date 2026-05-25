import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../firebase";
import { Movie } from "../types";

export function useMovies() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Only subscribe to unwatched movies
    const q = query(collection(db, "movies"), where("watched", "==", false));
    
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const results: Movie[] = [];
        snapshot.forEach((doc) => {
          results.push({ id: doc.id, ...doc.data() } as Movie);
        });
        setMovies(results);
        setLoading(false);
      },
      (err) => {
        console.error("Firebase error", err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return { movies, loading, error };
}
