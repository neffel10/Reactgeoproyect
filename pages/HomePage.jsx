import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Search from '../components/Search';
import useFavorites from '../hooks/useFavorites';
import { Heart } from 'lucide-react';
import { useDebounce } from '../hooks/useDebounce';

// ** API INSERTED **

const API_KEY = import.meta.env.VITE_WEATHER_API_KEY;

const HomePage = () => {
    const navigate = useNavigate();

    // 1. Favorites Hook 
    const { isFavorite, addFavorite, removeFavorite } = useFavorites();

    // 2. Weather and Search States
    const [searchTerm, setSearchTerm] = useState('');
    const [cityData, setCityData] = useState(null);
    const [weatherData, setWeatherData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const cacheRef = useRef({});
    const lastRequestedRef = useRef('');
    const debouncedSearchTerm = useDebounce(searchTerm, 500);

    /*IMPORTANTE| useState: Son básicamente variables dinámicas que una vez que les das o mandas un valor lo toma y le dicen a React que lo rendericen*/ 
    /*useState: is basically a way to have dynamic variables in React components*/ 

    //Function to get the weather icon URL, useful if the API changes its URL style, we can make adjustments here. Also, it serves to encapsulate the URL in a variable instead of writing the long URL throughout the code.
    const getWeatherIconUrl = (iconCode) => {
        if (!iconCode) return null;
        return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
    };

    // Function to handle common API errors, mainly for cleaner code but also to handle common errors in fewer lines than doing it specifically for each type of error.
    const handleApiError = (response) => {
        if (response.status === 401) {
            throw new Error(`Error 401: Invalid API Key. Check your OWM API key.`);
        }
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status} - ${response.statusText}`);
        }
    };
    
    // Function to toggle the favorite state
    const handleToggleFavorite = () => {
        //Guard Clause: basically, if we already have city data, it proceeds to show the add to favorite button, but if not, it doesn't, thus avoiding showing it even if we give the wrong city or don't have it. return is to exit the function
        if (!cityData) return;

        // Create the city object with the necessary data to save
        const cityToSave = {
            name: cityData.name,
            country: cityData.country,
            lat: cityData.lat,
            lon: cityData.lon,
        };

        //Logica de Alternancia (toggle) //Alternating Logic (toggle)
        if (isFavorite(cityData.name)) {
            removeFavorite(cityData.name);
            console.log("City removed from favorites:", cityData.name);
        } else {
            addFavorite(cityToSave);
            console.log("City added to favorites:", cityData.name);
        }
    };


    // --- FUNCTION PHASE 2: Get the Weather using Coordinates ---
    const fetchWeather = useCallback(async (lat, lon, cityName) => {
        const cacheKey = `${cityName}-${lat}-${lon}`.toLowerCase();
        const cachedWeatherData = cacheRef.current[cacheKey];

        if (cachedWeatherData) {
            setWeatherData(cachedWeatherData);
            return cachedWeatherData;
        }

        const weatherUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&lang=es&appid=${API_KEY}`;

        try {
            const response = await fetch(weatherUrl);
            handleApiError(response);

            const data = await response.json();
            cacheRef.current[cacheKey] = data;
            setWeatherData(data);
            return data;

        } catch (err) {
            console.error("Error fetching weather data:", err);
            setError(`Failed to fetch weather data: ${err.message}`);
            setWeatherData(null);
            setCityData(null);
            return null;
        }
    }, []);

    // --- FUNCTION PHASE 1: Get Coordinates and then the Weather ---
    const fetchCoordinates = useCallback(async (cityName) => {
        const normalizedCityName = cityName.trim();
        const cacheKey = normalizedCityName.toLowerCase();

        if (cacheRef.current[cacheKey]) {
            const cachedResult = cacheRef.current[cacheKey];
            setCityData(cachedResult.cityData);
            setWeatherData(cachedResult.weatherData);
            setError(null);
            setIsLoading(false);
            return;
        }

        // Reiniciar estados para la nueva búsqueda
        setIsLoading(true);
        setError(null);
        setCityData(null);
        setWeatherData(null);

        const geocodingUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${normalizedCityName}&limit=1&appid=${API_KEY}`;

        try {
            const response = await fetch(geocodingUrl);
            handleApiError(response);

            const data = await response.json();

            if (data.length === 0) {
                throw new Error(`Results not found for: ${normalizedCityName}`);
            }

            const result = data[0];
            const newCityData = {
                lat: result.lat,
                lon: result.lon,
                name: result.name,
                country: result.country
            };

            setCityData(newCityData);

            const weatherResult = await fetchWeather(newCityData.lat, newCityData.lon, newCityData.name);
            cacheRef.current[cacheKey] = {
                cityData: newCityData,
                weatherData: weatherResult,
            };

        } catch (err) {
            console.error("Error fetching coordinates:", err);
            setError(`Error: ${err.message}`);
            setCityData(null);
            setWeatherData(null);
        } finally {
            setIsLoading(false);
        }
    }, [fetchWeather]);

    const handleSearchSubmit = useCallback((term) => {
        const normalizedTerm = term.trim();
        if (!normalizedTerm) return;

        setSearchTerm(normalizedTerm);
        lastRequestedRef.current = normalizedTerm.toLowerCase();
        fetchCoordinates(normalizedTerm);
    }, [fetchCoordinates]);

    useEffect(() => {
    const normalizedTerm = debouncedSearchTerm.trim().toLowerCase();
    
    if (!normalizedTerm) {
        setError(null);
        setIsLoading(false);
        return;
    }

    // If it matches the last requested term, we cancel duplicate requests
    if (lastRequestedRef.current === normalizedTerm) {
        return;
    }

    // If it's already in the cache, we assign it directly without calling fetchCoordinates
    if (cacheRef.current[normalizedTerm]) {
        const cachedResult = cacheRef.current[normalizedTerm];
        setCityData(cachedResult.cityData);
        setWeatherData(cachedResult.weatherData);
        setError(null);
        setIsLoading(false);
        lastRequestedRef.current = normalizedTerm;
        return;
    }

    // We register the active request and trigger the physical search
    lastRequestedRef.current = normalizedTerm;
    fetchCoordinates(debouncedSearchTerm.trim());

// We remove fetchCoordinates from the dependencies to isolate the effect from infinite executions
// eslint-disable-next-line react-hooks/exhaustive-deps
}, [debouncedSearchTerm]);

    // Function to handle the click on the card (Navigation)
    const handleCardClick = () => {
        if (cityData) {
            // Navigates to a dynamic path like "/city/Hermosillo"
            navigate(`/city/${encodeURIComponent(cityData.name)}`);
        }
    };

    // Adjustments in rendering to use data from /forecast (list[0])
    // NOTA PROPIA:Los ? son una manera de comprobar mas corta que a como se hacia antes con && o OR ||
    const currentForecast = weatherData?.list?.[0]; // The first item in the forecast list is the current weather
    const temp = currentForecast?.main?.temp;
    const weatherDescription = currentForecast?.weather?.[0]?.description;
    const weatherIcon = currentForecast?.weather?.[0]?.icon;
    const windSpeed = currentForecast?.wind?.speed;
    const humidity = currentForecast?.main?.humidity;
    const pressure = currentForecast?.main?.pressure;
    
    // Determining if the current city is a favorite to show the correct icon
    const isCurrentCityFavorite = cityData ? isFavorite(cityData.name) : false;

    return (
        <div className="min-h-screen bg-blue-200 py-12 px-4 sm:px-6 lg:px-8 shadow-lg">
            <div className="max-w-xl mx-auto bg-white pt-12 pl-8 pr-8 pb-12 rounded-2xl shadow-xl">
                <h1 className="text-4xl font-extrabold text-pink-500 text-center mb-10">
                    Weather & Advanced Geolocalization
                </h1>
                
                {/* Navigation to Favorites Button */}
                <div className="text-center mb-8">

                <button
                    onClick={() => navigate('/favorites')} 
                    className="px-6 py-2 bg-pink-500 text-white-600 font-semibold rounded-lg shadow-md hover:bg-pink-200 transition duration-150 transform hover:scale-105 flex items-center mx-auto justify-center hover:text-pink-900"
                >
                    <Heart className="w-5 h-5 fill-pink-600" />
                    See my Favorites
                </button>   

                </div>
                
                <Search
                    searchTerm={searchTerm}
                    onSearchTermChange={setSearchTerm}
                    onSearchSubmit={handleSearchSubmit}
                />

                <div className="text-center p-6 bg-transparent rounded-xl">
                    {isLoading && (
                        // Loading Spinner and Message
                        <div className="flex justify-center items-center space-x-2 text-blue-600">
                            <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <p className="font-medium">Getting data...</p>
                        </div>
                    )}

                    {error && (
                        // Error Message Display
                        <div className="p-4 bg-red-100 border-l-4 border-red-500 text-red-700 rounded-md">
                            <p className="font-bold">Search Failed</p>
                            <p>{error}</p>
                        </div>
                    )}

                    {/* ** Final Weather Result ** */}
                    {cityData && currentForecast && !isLoading && (
                        <div 
                            className="bg-gradient-to-br from-blue-100 to-white p-8 rounded-lg shadow-2xl max-w-lg mx-auto border-t-4 border-blue-500 cursor-pointer 
                                       transform transition duration-300 hover:scale-[1.05] hover:shadow-xl relative group" // Add 'relative group'
                            // The main clic navigates to the city detail page, but the favorite button is absolute and stops propagation
                            onClick={handleCardClick} 
                        >
                            {/* Favorites Button (Absolute) */}
                            <button
                                className="absolute top-3 right-3 p-2 rounded-full bg-white/70 backdrop-blur-sm shadow-md 
                                           transition duration-150 hover:bg-white z-10"
                                onClick={(e) => {
                                    e.stopPropagation(); // PREVENTS the click from navigating to the detail view
                                    handleToggleFavorite();
                                }}
                                title={isCurrentCityFavorite ? "Delete from Favorites" : "Add to Favorites"}
                            >
                                {isCurrentCityFavorite ? (
                                    <Heart className="w-6 h-6 text-pink-500 fill-pink-500" />
                                ) : (
                                    <Heart className="w-6 h-6 text-gray-400 group-hover:text-pink-500" />
                                )}
                            </button>
                            
                            <h2 className="text-4xl font-bold text-gray-800 mb-2">{cityData.name}, {cityData.country}</h2>
                            <p className="text-lg text-gray-500 mb-6">Actual Weather (Clic for more details)</p>

                            <div className="flex items-center justify-center space-x-6">
                                {/* Icon and Temperature */}
                                {weatherIcon && (
                                    <div className={`rounded-full ${weatherIcon.endsWith('n') ? 'bg-blue-900/50' : 'bg-transparent'}`}>
                                    <img 
                                        src={getWeatherIconUrl(weatherIcon)} 
                                        alt={weatherDescription} 
                                        className="w-20 h-20"
                                    />
                                    </div>
                                )}
                                <div className="text-left">
                                    <p className="text-6xl font-extrabold text-blue-600">
                                        {Math.round(temp)}°C
                                    </p>
                                    <p className="text-xl font-semibold text-gray-700 capitalize">
                                        {weatherDescription}
                                    </p>
                                </div>
                            </div>

                            {/* Additional Details */}
                            <div className="grid grid-cols-3 gap-4 mt-8 pt-4 border-t border-gray-200 text-gray-700">
                                <div>
                                    <p className="text-sm font-medium">Wind</p>
                                    <p className="font-bold">{windSpeed.toFixed(1)} m/s</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium">Humidity</p>
                                    <p className="font-bold">{humidity}%</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium">Pressure</p>
                                    <p className="font-bold">{pressure} hPa</p>
                                </div>
                            </div>
                            
                            <p className="mt-8 text-md text-gray-500 border-t pt-4">                    
                                Click on the card to see the weather for the next 5 days.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default HomePage;