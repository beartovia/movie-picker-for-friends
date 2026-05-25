import { useState, useEffect } from "react";
import { searchMoviesTMDB, TMDBMovie, getImageUrl, getMainGenre } from "../lib/tmdb";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { Search, Plus } from "lucide-react";

export function AddMovie({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<TMDBMovie[]>([]);
  const [loading, setLoading] = useState(false);
  const [suggestedBy, setSuggestedBy] = useState("");
  const [addingId, setAddingId] = useState<number | null>(null);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.trim().length > 1) {
        setLoading(true);
        const res = await searchMoviesTMDB(query);
        setResults(res.slice(0, 8)); // Top 8 results
        setLoading(false);
      } else {
        setResults([]);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [query]);

  const handleAdd = async (movie: TMDBMovie) => {
    if (!suggestedBy.trim()) {
      alert("Please enter your name!");
      return;
    }
    
    setAddingId(movie.id);
    
    try {
      await addDoc(collection(db, "movies"), {
        externalId: String(movie.id),
        title: movie.title,
        genre: getMainGenre(movie.genre_ids),
        imageUrl: getImageUrl(movie.poster_path),
        suggestedBy: suggestedBy.trim(),
        watched: false,
        createdAt: Date.now(),
      });
      alert(`Added ${movie.title} to the pool!`);
      setQuery("");
      setResults([]);
    } catch (error) {
      console.error(error);
      alert("Failed to add movie.");
    } finally {
      setAddingId(null);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-[#0a0a0a] backdrop-blur-xl rounded-xl p-6 md:p-8 border border-white/10 shadow-2xl mt-16">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-serif italic text-amber-500 tracking-wider">Add a Movie</h2>
        <button onClick={onClose} className="text-white/40 hover:text-amber-500 transition-colors uppercase text-[10px] tracking-widest font-bold">
          Close
        </button>
      </div>

      <div className="mb-8 p-4 bg-white/5 rounded border border-white/5">
        <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-2 font-bold">Your Name</label>
        <input 
          type="text" 
          value={suggestedBy}
          onChange={e => setSuggestedBy(e.target.value)}
          placeholder="e.g. John" 
          className="w-full px-4 py-3 bg-neutral-900 border border-white/10 rounded text-white placeholder-white/30 focus:outline-none focus:border-amber-500/50 transition-colors"
        />
      </div>

      <div className="relative mb-8">
        <input 
          type="text" 
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Start typing to search global database..." 
          className="w-full pl-12 pr-4 py-3 bg-neutral-900 border border-white/10 rounded-md text-white placeholder-white/30 focus:outline-none focus:border-amber-500/50 transition-colors text-sm"
        />
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 w-4 h-4" />
        {!import.meta.env.VITE_TMDB_API_KEY && (
          <div className="absolute -bottom-6 left-0 text-[10px] text-amber-500 uppercase flex items-center gap-2">
            ⚠️ Missing VITE_TMDB_API_KEY inside environment configuration
          </div>
        )}
      </div>

      {loading ? (
        <div className="text-center text-white/40 py-8 text-[10px] tracking-widest uppercase font-mono">Searching DB...</div>
      ) : (
        <div className="space-y-4">
          {results.map((m) => (
            <div key={m.id} className="group flex gap-4 p-4 rounded-lg bg-white/5 border border-white/5 hover:border-amber-500/20 transition-colors flex-col sm:flex-row items-center sm:items-start text-center sm:text-left">
              {m.poster_path ? (
                <img src={getImageUrl(m.poster_path)} alt={m.title} className="w-20 h-28 object-cover rounded border border-white/10 shrink-0" />
              ) : (
                <div className="w-20 h-28 bg-neutral-800 rounded border border-white/10 flex items-center justify-center shrink-0">
                  <span className="text-[10px] text-white/30 uppercase tracking-widest flex flex-col items-center">
                    No Image
                  </span>
                </div>
              )}
              <div className="flex-1 flex flex-col pt-1 w-full">
                <h3 className="font-semibold text-lg text-[#e0e0e0] mb-1 line-clamp-2">
                  {m.title} {m.release_date ? <span className="text-white/40 text-[10px] font-normal">({m.release_date.split('-')[0]})</span> : null}
                </h3>
                <span className="inline-block px-2 py-0.5 bg-amber-500/10 w-max mx-auto sm:mx-0 rounded text-[10px] uppercase font-bold text-amber-500 tracking-wider">
                  {getMainGenre(m.genre_ids)}
                </span>
                
                <div className="mt-4 sm:mt-auto sm:self-end">
                  <button 
                    onClick={() => handleAdd(m)}
                    disabled={addingId === m.id}
                    className="flex items-center gap-2 px-5 py-2.5 bg-amber-500/10 border border-amber-500/20 text-amber-500 hover:bg-amber-500 hover:text-black rounded text-[10px] uppercase font-bold tracking-widest transition-all w-full justify-center disabled:opacity-50"
                  >
                    <Plus className="w-4 h-4" />
                    {addingId === m.id ? "Adding..." : "Add to Pool"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
