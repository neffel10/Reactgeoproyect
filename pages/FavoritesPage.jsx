import React from 'react';
import { useNavigate } from 'react-router-dom';
import useFavorites from '../hooks/useFavorites';
import { useTheme } from '../hooks/useTheme';
import FavoriteCityCard from '../components/FavoriteCityCard';
import { Home, Heart } from 'lucide-react';

const FavoritesPage = () => {
    const { favorites, removeFavorite } = useFavorites();
    const navigate = useNavigate();
    const { isDark } = useTheme();

    return (
        // Añadimos el contenedor principal background que combine con tu diseño (puedes ajustar las clases si usas fondo oscuro)
        <div className={`min-h-screen py-12 px-4 sm:px-6 lg:px-8 ${isDark ? 'bg-slate-900' : 'bg-blue-200'}`}>
            <div className="max-w-6xl mx-auto">
                <button 
  onClick={() => navigate('/')}
  className={`mb-8 inline-flex items-center gap-2 px-4 py-2 rounded-lg transition border ${
    isDark 
      ? "bg-white/10 text-slate-300 hover:bg-white/20 border-white/10" 
      : "bg-slate-800 text-white hover:bg-slate-700 border-slate-700 shadow-md"
  }`}
>
  <Home className="w-4 h-4" />
  Back to search
</button>
                
                <div className="mb-12 text-center">
                    <h1 className="text-5xl font-extrabold text-white mb-2">
                        My Favorites
                    </h1>
                    <p className="text-lg text-slate-400">
                        {favorites.length} saved cities
                    </p>
                </div>

                {favorites.length === 0 ? (
                    <div className="text-center max-w-md mx-auto p-12 bg-white/10 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl">
                        <Heart className="w-16 h-16 mx-auto mb-4 text-slate-400" />
                        <p className="text-xl font-semibold text-white mb-2">
                            No favorite cities yet
                        </p>
                        <p className="text-slate-400 mb-6">
                            Search for a city on the home page and click the heart icon to save it.
                        </p>
                        <button
                            onClick={() => navigate('/')}
                            className="px-6 py-2 bg-gradient-to-r from-sky-500 to-cyan-500 text-white font-semibold rounded-xl hover:from-sky-600 hover:to-cyan-600 transition-all"
                        >
                            Start exploring
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {favorites.map((city) => (
                            <FavoriteCityCard 
                                key={`${city.name}-${city.country}`} 
                                city={city} 
                                onRemove={() => removeFavorite(city.name)}
                                onCardClick={() => navigate(`/city/${encodeURIComponent(city.name)}`)}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default FavoritesPage;