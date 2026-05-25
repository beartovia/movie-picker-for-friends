export const API_KEY = import.meta.env.VITE_TMDB_API_KEY;

export interface TMDBMovie {
  id: number;
  title: string;
  poster_path: string | null;
  genre_ids: number[];
  release_date: string;
}

const genreMap: Record<number, string> = {
  28: "Action", 12: "Adventure", 16: "Animation", 35: "Comedy", 80: "Crime",
  99: "Documentary", 18: "Drama", 10751: "Family", 14: "Fantasy", 36: "History",
  27: "Horror", 10402: "Music", 9648: "Mystery", 10749: "Romance", 878: "Sci-Fi",
  10770: "TV Movie", 53: "Thriller", 10752: "War", 37: "Western"
};

export async function searchMoviesTMDB(query: string): Promise<TMDBMovie[]> {
  if (!query || !API_KEY) {
    if (!API_KEY) console.warn("Missing VITE_TMDB_API_KEY in environment");
    return [];
  }
  try {
    const url = `https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(query)}&api_key=${API_KEY}&language=en-US&page=1&include_adult=false`;
    const res = await fetch(url);
    const data = await res.json();
    return data.results || [];
  } catch (error) {
    console.error("TMDB search error:", error);
    return [];
  }
}

export function getMainGenre(genreIds: number[]): string {
  if (!genreIds || genreIds.length === 0) return "Unknown";
  return genreMap[genreIds[0]] || "Unknown";
}

export function getImageUrl(path: string | null): string {
  if (!path) return "";
  return `https://image.tmdb.org/t/p/w500${path}`;
}
