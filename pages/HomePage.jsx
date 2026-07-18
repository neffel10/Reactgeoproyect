import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Search from '../components/Search';
import useFavorites from '../hooks/useFavorites';
import { useTheme } from '../hooks/useTheme';
import { useDebounce } from '../hooks/useDebounce';
import { Heart, MapPin } from 'lucide-react'; 

// ** API INSERTED **

const API_KEY = import.meta.env.VITE_WEATHER_API_KEY || '';

const HomePage = () => {
    const navigate = useNavigate();
    const { isDark } = useTheme();

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
            console.error("Error al obtener el pronóstico:", err);
            setError(`Fallo al obtener el clima: ${err.message}`);
            setWeatherData(null);
            setCityData(null);
            return null;
        }
    }, []);

    // 🌍 NUEVA FUNCIÓN: Obtener ubicación GPS e invocar la API del Clima directamente
    const handleGetCurrentLocation = useCallback(() => {
        if (!navigator.geolocation) {
            setError("Tu navegador no soporta geolocalización.");
            return;
        }

        setIsLoading(true);
        setError(null);

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                
                // OpenWeather nos permite hacer "geocodificación inversa" opcional, 
                // pero para pintar el nombre rápido podemos ponerle un marcador o hacer fetch directo
                const currentCityName = "Tu ubicación"; 
                
                const newCityData = {
                    lat: latitude,
                    lon: longitude,
                    name: currentCityName,
                    country: "GPS"
                };

                setCityData(newCityData);
                await fetchWeather(latitude, longitude, currentCityName);
                setIsLoading(false);
            },
            (err) => {
                console.error("Error de geolocalización:", err);
                setError("No se pudo acceder a tu ubicación. Verifica los permisos de tu navegador.");
                setIsLoading(false);
            }
        );
    }, [fetchWeather]);

    // --- FUNCTION PHASE 1: Get Coordinates and then the Weather ---
    const fetchCoordinates = useCallback(async (cityName) => {
        if (!API_KEY) {
            setError('La API key de OpenWeather no está configurada. Añádela como secreto en GitHub y vuelve a desplegar.');
            setWeatherData(null);
            setCityData(null);
            setIsLoading(false);
            return;
        }

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

    // 🌍 Efecto para disparar la geolocalización automáticamente al abrir la app
useEffect(() => {
    // Si ya hay datos cargados previamente o el usuario ya escribió algo en el input, no interrumpimos
    if (cityData || searchTerm) return;

    if (!navigator.geolocation) {
        console.warn("Tu navegador no soporta geolocalización.");
        return;
    }

    setIsLoading(true);

    navigator.geolocation.getCurrentPosition(
        async (position) => {
            const { latitude, longitude } = position.coords;
            
            // Para que la interfaz se vea premium, usaremos las coordenadas de Hermosillo/tu zona
            // OpenWeather nos devolverá el nombre real de tu ciudad en la respuesta del forecast
            const currentCityName = "Tu ubicación"; 
            
            const newCityData = {
                lat: latitude,
                lon: longitude,
                name: currentCityName,
                country: "GPS"
            };

            setCityData(newCityData);
            
            // Disparamos la API con tus coordenadas
            const weatherResult = await fetchWeather(latitude, longitude, currentCityName);
            
            // Opcional: Si quieres sobreescribir "Tu ubicación" con el nombre real de la ciudad 
            // que devuelve la API de OpenWeatherMap en su propiedad data.city.name:
            if (weatherResult && weatherResult.city) {
                setCityData({
                    lat: latitude,
                    lon: longitude,
                    name: weatherResult.city.name,
                    country: weatherResult.city.country
                });
            }
            
            setIsLoading(false);
        },
        (err) => {
            console.warn("El usuario denegó o bloqueó el permiso de ubicación:", err.message);
            // No seteamos un error ruidoso en pantalla aquí, para que si el usuario rechaza el permiso,
            // la app simplemente se quede limpia esperando a que use el buscador de forma manual.
            setIsLoading(false);
        }
    );
}, [fetchWeather, cityData, searchTerm]); // Añadimos las dependencias de control

    return (
        <div className={`min-h-screen ${
            isDark
                ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900'
                : 'bg-gradient-to-br from-slate-50 via-white to-slate-50'
        } py-12 px-4 sm:px-6 lg:px-8`}>
            <div className="max-w-2xl mx-auto">
                {/* Header Section */}
                <div className="text-center mb-12">
                    <h1 className={`text-5xl sm:text-6xl font-extrabold mb-4 tracking-tight ${
                        isDark ? 'text-white' : 'text-slate-900'
                    }`}>
                        Weather
                        <span className={`block text-transparent bg-clip-text ${
                            isDark
                                ? 'bg-gradient-to-r from-sky-400 to-cyan-300'
                                : 'bg-gradient-to-r from-sky-600 to-cyan-500'
                        }`}>Explorer</span>
                    </h1>
                    <p className={`text-lg max-w-md mx-auto ${
                        isDark ? 'text-slate-400' : 'text-slate-600'
                    }`}>
                        Discover real-time weather forecasts and detailed climate patterns for any city worldwide.
                    </p>
                </div>

                {/* Main Card */}
                <div className={`${
                    isDark
                        ? 'bg-white/10 border-white/10'
                        : 'bg-slate-100/50 border-slate-200'
                } backdrop-blur-xl rounded-3xl p-8 shadow-2xl border mb-8`}>
                    {/* Navigation to Favorites */}
                    <div className="flex justify-center mb-8">
                        <button
                            onClick={() => navigate('/favorites')}
                            className={`inline-flex items-center gap-2 px-6 py-3 ${
                                isDark
                                    ? 'bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-600 hover:to-cyan-600'
                                    : 'bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-700 hover:to-cyan-700'
                            } text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105`}
                        >
                            <Heart className="w-5 h-5" />
                            My Favorites
                        </button>
                    </div>


                    <div className="flex flex-col sm:flex-row items-center gap-2 mb-6">
    <div className="flex-1 w-full">
        <Search
            searchTerm={searchTerm}
            onSearchTermChange={setSearchTerm}
            onSearchSubmit={handleSearchSubmit}
        />
    </div>
    
</div>

                    {/* Results Section */}
                    <div className="space-y-6">
                        {isLoading && (
                            <div className="flex flex-col items-center justify-center py-12">
                                <div className={`flex items-center gap-3 ${
                                    isDark ? 'text-slate-300' : 'text-slate-600'
                                }`}>
                                    <svg className="animate-spin h-6 w-6 text-sky-400" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    <p className="text-lg font-medium">Loading forecast data...</p>
                                </div>
                            </div>
                        )}

                        {error && (
                            <div className={`${
                                isDark
                                    ? 'bg-red-500/10 border-red-500/50 text-red-300'
                                    : 'bg-red-100 border-red-300 text-red-700'
                            } border rounded-2xl p-4`}>
                                <p className="font-semibold mb-1">Search Failed</p>
                                <p className="text-sm">{error}</p>
                            </div>
                        )}

                        {/* Weather Result Card */}
                        {cityData && currentForecast && !isLoading && (
                            <div
                                className={`${
                                    isDark
                                        ? 'bg-gradient-to-br from-sky-600/20 to-cyan-600/20 border-sky-400/30 hover:border-sky-400/50 hover:from-sky-600/30 hover:to-cyan-600/30'
                                        : 'bg-gradient-to-br from-sky-100/50 to-cyan-100/50 border-sky-200 hover:border-sky-300 hover:from-sky-100 hover:to-cyan-100'
                                } border rounded-3xl p-8 cursor-pointer transition-all duration-300 group`}
                                onClick={handleCardClick}
                            >
                                {/* Header with Title and Favorite Button */}
                                <div className="flex items-start justify-between mb-8">
                                    <div>
                                        <h2 className={`text-4xl font-bold mb-1 ${
                                            isDark ? 'text-white' : 'text-slate-900'
                                        }`}>
                                            {cityData.name}
                                        </h2>
                                        <p className={isDark ? 'text-sky-300' : 'text-sky-700'}>{cityData.country}</p>
                                    </div>
                                    <button
                                        className={`p-3 rounded-full ${
                                            isDark
                                                ? 'bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20'
                                                : 'bg-slate-200/50 border-slate-300 hover:bg-slate-300/50'
                                        } border transition-all duration-200`}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleToggleFavorite();
                                        }}
                                        title={isCurrentCityFavorite ? "Remove from favorites" : "Add to favorites"}
                                    >
                                        {isCurrentCityFavorite ? (
                                            <Heart className="w-6 h-6 text-red-400 fill-red-400" />
                                        ) : (
                                            <Heart className={`w-6 h-6 ${
                                                isDark ? 'text-slate-400 group-hover:text-red-400' : 'text-slate-600 group-hover:text-red-500'
                                            }`} />
                                        )}
                                    </button>
                                </div>

                                {/* Temperature Section */}
                                <div className={`flex items-center gap-8 mb-8 pb-8 ${
                                    isDark ? 'border-white/10' : 'border-slate-300'
                                } border-b`}>
                                    {weatherIcon && (
                                        <div className="flex-shrink-0">
                                            <img
                                                src={getWeatherIconUrl(weatherIcon)}
                                                alt={weatherDescription}
                                                className="w-24 h-24 filter drop-shadow-lg"
                                            />
                                        </div>
                                    )}
                                    <div>
                                        <p className={`text-7xl font-extrabold mb-2 ${
                                            isDark ? 'text-white' : 'text-slate-900'
                                        }`}>
                                            {Math.round(temp)}°
                                        </p>
                                        <p className={`text-xl capitalize font-semibold ${
                                            isDark ? 'text-sky-200' : 'text-sky-700'
                                        }`}>
                                            {weatherDescription}
                                        </p>
                                    </div>
                                </div>

                                {/* Details Grid */}
                                <div className="grid grid-cols-3 gap-4 mb-6">
                                    <div className={`${
                                        isDark ? 'bg-white/5 border-white/10' : 'bg-slate-200/50 border-slate-300'
                                    } rounded-2xl p-4 border`}>
                                        <p className={`text-sm font-medium mb-2 ${
                                            isDark ? 'text-slate-400' : 'text-slate-600'
                                        }`}>Wind Speed</p>
                                        <p className={`text-2xl font-bold ${
                                            isDark ? 'text-cyan-300' : 'text-cyan-700'
                                        }`}>{windSpeed.toFixed(1)}</p>
                                        <p className={`text-xs mt-1 ${
                                            isDark ? 'text-slate-500' : 'text-slate-500'
                                        }`}>m/s</p>
                                    </div>
                                    <div className={`${
                                        isDark ? 'bg-white/5 border-white/10' : 'bg-slate-200/50 border-slate-300'
                                    } rounded-2xl p-4 border`}>
                                        <p className={`text-sm font-medium mb-2 ${
                                            isDark ? 'text-slate-400' : 'text-slate-600'
                                        }`}>Humidity</p>
                                        <p className={`text-2xl font-bold ${
                                            isDark ? 'text-blue-300' : 'text-blue-700'
                                        }`}>{humidity}%</p>
                                    </div>
                                    <div className={`${
                                        isDark ? 'bg-white/5 border-white/10' : 'bg-slate-200/50 border-slate-300'
                                    } rounded-2xl p-4 border`}>
                                        <p className={`text-sm font-medium mb-2 ${
                                            isDark ? 'text-slate-400' : 'text-slate-600'
                                        }`}>Pressure</p>
                                        <p className={`text-2xl font-bold ${
                                            isDark ? 'text-sky-300' : 'text-sky-700'
                                        }`}>{pressure}</p>
                                        <p className={`text-xs mt-1 ${
                                            isDark ? 'text-slate-500' : 'text-slate-500'
                                        }`}>hPa</p>
                                    </div>
                                </div>

                                {/* CTA */}
                                <div className={`${
                                    isDark
                                        ? 'bg-gradient-to-r from-sky-500/10 to-cyan-500/10 border-sky-400/30'
                                        : 'bg-gradient-to-r from-sky-100 to-cyan-100 border-sky-300'
                                } border rounded-2xl p-4 text-center`}>
                                    <p className={`font-medium ${
                                        isDark
                                            ? 'text-slate-300 group-hover:text-sky-300'
                                            : 'text-slate-700 group-hover:text-sky-700'
                                    } transition-colors`}>
                                        Tap to explore 5-day forecast & detailed analytics
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Empty State */}
                        {!cityData && !isLoading && !error && (
                            <div className="text-center py-12">
                                <p className={`text-lg ${
                                    isDark ? 'text-slate-400' : 'text-slate-600'
                                }`}>Search for a city to get started</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HomePage;