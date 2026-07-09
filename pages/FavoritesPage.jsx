import React from 'react';
import { useNavigate } from 'react-router-dom';
import useFavorites from '../hooks/useFavorites';
import FavoriteCityCard from '../components/FavoriteCityCard'; // <-- Key import
import { Home } from 'lucide-react'; // 

const FavoritesPage = () => {
    const { favorites, removeFavorite } = useFavorites();
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
                <button 
                    onClick={() => navigate('/')}
                    className="mb-8 px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition flex items-center"
                >
                    <Home className="w-4 h-4 mr-2" />
                    Get back to the Search
                </button>
                
                <h1 className="text-5xl font-extrabold text-pink-600 text-center mb-10">
                    My Favorite Cities ({favorites.length})
                </h1>

                {favorites.length === 0 ? (             
                    // Show this message if the list is empty
                    <div className="text-center p-12 bg-white rounded-xl shadow-lg border-2 border-dashed border-gray-300">
                        <p className="text-xl text-gray-600 font-semibold mb-4">
                            ¡You dont have favorite cities yet!
                        </p>
                        <p className="text-gray-500">
                            Search for a city in the home page and clic the heart icon to save it.
                        </p>
                    </div>
                ) : (
                    // Show the list of favorite cities if there are any
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {favorites.map((city) => (
                            <FavoriteCityCard 
                                // The key is important for React's efficiency
                                key={`${city.name}-${city.country}`} 
                                city={city} 
                                // We pass the remove function to the child component
                                onRemove={() => removeFavorite(city.name)}
                                // We pass the navigation function to the child component
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