/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { useMovies } from './hooks/useMovies';
import { AddMovie } from './components/AddMovie';
import { SpinWheel } from './components/SpinWheel';
import { Popcorn, Plus, RotateCcw, Check, Clapperboard, Trash2 } from 'lucide-react';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from './firebase';
import { Movie } from './types';
import { motion, AnimatePresence } from 'motion/react';

type PlayState = 'idle' | 'genre-picked' | 'movie-picked';

export default function App() {
  const { movies, loading, error } = useMovies();
  const [showAdd, setShowAdd] = useState(false);
  const [playState, setPlayState] = useState<PlayState>('idle');
  
  const [pickedGenre, setPickedGenre] = useState<string | null>(null);
  const [pickedMovie, setPickedMovie] = useState<Movie | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_center,_#1a1a1a_0%,_#050505_70%)] flex items-center justify-center">
        <div className="text-white/60 text-xl animate-pulse font-mono tracking-widest flex items-center gap-3">
          <Clapperboard className="w-6 h-6 animate-spin" />
          LOADING MOVIES...
        </div>
      </div>
    );
  }

  // Generate unique genres from unwatched movies
  const genres = Array.from(new Set(movies.map(m => m.genre)));

  const handleGenrePicked = (genre: string) => {
    setPickedGenre(genre);
    setPlayState('genre-picked');
  };

  const handleMoviePicked = (title: string) => {
    const movie = movies.find(m => m.genre === pickedGenre && m.title === title);
    if (movie) {
      setPickedMovie(movie);
      setPlayState('movie-picked');
    }
  };

  const handleVetoGenre = () => {
    setPickedGenre(null);
    setPlayState('idle');
  };

  const handleVetoMovie = () => {
    setPickedMovie(null);
    setPlayState('genre-picked');
  };

  const handleWatch = async () => {
    if (!pickedMovie?.id) return;
    try {
      await updateDoc(doc(db, "movies", pickedMovie.id), { watched: true });
      // Reset state for next time
      setPickedMovie(null);
      setPickedGenre(null);
      setPlayState('idle');
    } catch (error) {
      console.error(error);
      alert("Failed to mark movie as watched.");
    }
  };

  const handleRemove = async (movieId: string) => {
    try {
      await deleteDoc(doc(db, "movies", movieId));
    } catch (e) {
      console.error(e);
      alert("Failed to delete movie.");
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-[#e0e0e0] font-sans selection:bg-amber-500/30 overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-4 py-8 md:py-12 flex flex-col min-h-screen">
        
        {/* Header */}
        <header className="flex items-center justify-between mb-16">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-500 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.2)] border border-amber-400/20">
              <Popcorn className="w-6 h-6 text-black" />
            </div>
            <div>
              <h1 className="text-2xl font-serif italic text-amber-500 tracking-wider">Cine-Roulette</h1>
              <p className="text-[10px] text-white/50 tracking-[0.2em] uppercase mt-1">Public Movie Picker</p>
            </div>
          </div>
          <button 
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 bg-amber-600 hover:bg-amber-500 px-5 py-2.5 rounded text-black font-bold text-xs uppercase tracking-tighter transition-all"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Movie</span>
          </button>
        </header>

        {/* Main Content */}
        <main className="flex-1 flex flex-col items-center justify-center w-full relative">
          <AnimatePresence mode="wait">
            
            {showAdd ? (
              <motion.div 
                key="add"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="w-full absolute inset-0 z-50 bg-[#050505] overflow-y-auto"
              >
                <AddMovie onClose={() => setShowAdd(false)} />
              </motion.div>
            ) : (
              <motion.div 
                key="play"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full flex flex-col items-center justify-center"
              >
                {playState === 'idle' && (
                  <div className="w-full max-w-2xl text-center">
                    <h2 className="text-4xl sm:text-5xl font-serif italic text-white mb-4 tracking-wider">Step 1: Spin for Genre</h2>
                    <p className="text-white/60 text-sm mb-12 max-w-lg mx-auto tracking-wide">
                      Let the fates decide the mood. We will pick a genre from the {movies.length} unwatched movies in the database.
                    </p>
                    <SpinWheel items={genres} onSpinEnd={handleGenrePicked} />
                  </div>
                )}

                {playState === 'genre-picked' && (
                  <div className="w-full max-w-2xl text-center">
                    <div className="inline-block px-4 py-1.5 bg-amber-500/10 text-amber-500 text-[10px] font-bold uppercase tracking-[0.3em] rounded mb-6">
                      Genre Selected
                    </div>
                    <h2 className="text-5xl sm:text-6xl font-serif italic text-white mb-4 tracking-wider">
                      {pickedGenre}
                    </h2>
                    <p className="text-white/60 text-sm mb-12 max-w-lg mx-auto tracking-wide">
                      Alright, we are watching a {pickedGenre} movie! Let's spin to see exactly which one.
                    </p>
                    
                    <SpinWheel 
                      items={movies.filter(m => m.genre === pickedGenre).map(m => m.title)} 
                      onSpinEnd={handleMoviePicked} 
                    />

                    <button 
                      onClick={handleVetoGenre}
                      className="mt-12 flex items-center gap-2 mx-auto px-6 py-3 border border-amber-500/50 text-amber-500 hover:bg-amber-500/10 text-[10px] uppercase font-bold tracking-widest rounded transition-colors"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Veto Genre & Respin
                    </button>
                  </div>
                )}

                {playState === 'movie-picked' && pickedMovie && (
                  <div className="w-full max-w-3xl flex flex-col items-center">
                    <div className="inline-block px-4 py-1.5 bg-amber-500/10 text-amber-500 text-[10px] font-bold uppercase tracking-[0.3em] rounded mb-8">
                      Movie Selected
                    </div>
                    
                    <div className="flex flex-col md:flex-row items-center md:items-start gap-8 bg-white/5 p-8 rounded-xl border border-white/10 w-full shadow-2xl relative overflow-hidden">
                      {pickedMovie.imageUrl ? (
                        <img 
                          src={pickedMovie.imageUrl} 
                          alt={pickedMovie.title} 
                          className="w-48 md:w-64 aspect-[2/3] object-cover rounded-xl shadow-2xl shrink-0 border border-white/10" 
                        />
                      ) : (
                        <div className="w-48 md:w-64 aspect-[2/3] bg-neutral-900 rounded-xl flex items-center justify-center border border-white/10">
                          <Popcorn className="w-12 h-12 text-white/20" />
                        </div>
                      )}
                      
                      <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left h-full justify-center">
                        <span className="text-[10px] font-bold text-amber-500 tracking-[0.3em] uppercase mb-4">
                          {pickedMovie.genre}
                        </span>
                        <h2 className="text-3xl sm:text-4xl font-serif italic text-white mb-6 leading-tight">
                          {pickedMovie.title}
                        </h2>
                        
                        <div className="flex items-center gap-3 bg-white/5 px-5 py-3 rounded border border-white/10 mb-8 w-full md:w-auto">
                          <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center text-amber-500 text-xs font-bold uppercase shrink-0 border border-amber-500/20">
                            {pickedMovie.suggestedBy?.charAt(0) || '?'}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[10px] uppercase tracking-widest text-white/40">Suggested By</span>
                            <span className="text-sm font-semibold">{pickedMovie.suggestedBy}</span>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-4 mt-auto w-full">
                          <button 
                            onClick={handleWatch}
                            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-8 py-4 bg-white hover:bg-neutral-200 text-black font-black text-xs uppercase tracking-widest rounded shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-colors"
                          >
                            <Check className="w-4 h-4" />
                            WE ARE WATCHING THIS
                          </button>
                          
                          <button 
                            onClick={handleVetoMovie}
                            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-4 border border-red-500/50 hover:bg-red-500/10 text-red-500 font-bold text-[10px] uppercase tracking-widest rounded transition-colors"
                          >
                            <RotateCcw className="w-4 h-4" />
                            VETO MOVIE
                          </button>
                        </div>
                        <button 
                          onClick={handleVetoGenre}
                          className="mt-6 flex items-center justify-center gap-2 px-6 py-3 border border-amber-500/50 text-amber-500 hover:bg-amber-500/10 font-bold text-[10px] uppercase tracking-widest rounded transition-colors w-full md:w-auto"
                        >
                          <RotateCcw className="w-4 h-4" />
                          VETO GENRE
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

          </AnimatePresence>
        </main>

        {/* Footer / Stats */}
        {!showAdd && playState === 'idle' && (
          <footer className="mt-16 w-full max-w-5xl mx-auto">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.4em] text-white/30 mb-6 text-center">The Pool ({movies.length} Movies)</h3>
            {movies.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {movies.map(m => (
                  <div key={m.id} className="group relative aspect-[2/3] rounded-lg overflow-hidden bg-neutral-900 border border-white/5">
                     {m.imageUrl ? (
                        <img src={m.imageUrl} alt={m.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                     ) : (
                        <div className="w-full h-full flex items-center justify-center p-4">
                          <span className="text-[10px] text-center text-white/40 uppercase tracking-widest font-bold">{m.title}</span>
                        </div>
                     )}
                     <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black via-black/80 to-transparent pt-12">
                       <p className="text-xs font-semibold text-white truncate drop-shadow-md">{m.title}</p>
                       <p className="text-[10px] text-amber-500/80 italic truncate mt-0.5">Suggested by {m.suggestedBy}</p>
                     </div>
                     
                     <button 
                       onClick={() => handleRemove(m.id!)}
                       className="absolute top-2 right-2 p-1.5 bg-red-500/80 hover:bg-red-500 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm"
                       title="Remove this movie"
                     >
                       <Trash2 className="w-3 h-3" />
                     </button>
                  </div>
                ))}
              </div>
            ) : (
               <div className="text-center text-white/30 bg-neutral-900/50 rounded-xl py-12 border border-white/5 border-dashed uppercase text-[10px] font-bold tracking-widest">
                 The pool is empty. Click "Add Movie" to populate the wheel!
               </div>
            )}
          </footer>
        )}
      </div>
    </div>
  );
}

