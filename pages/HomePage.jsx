import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Search from '../components/Search';
import useFavorites from '../hooks/useFavorites'; // <-- Importación del Hook
import { Heart, HeartCrack } from 'lucide-react'; // Iconos para Favoritos

// ** CLAVE API INSERTADA **
const API_KEY = 'acdd42a06d211c22f9c59ab85e650601'; 

const HomePage = () => {
    const navigate = useNavigate(); //React Router DOM Hook to manage paths (like ajax)
    //"Resumen: Dame la herramienta que necesito para saltar a otra página cuando yo lo decida en mi código."
    
    // 1. Hook de Favoritos 
    //Esto es desestructuración, es una característica de JavaScript que te permite extraer propiedades específicas de un objeto y asignarlas a variables con el mismo nombre.
    const { isFavorite, addFavorite, removeFavorite } = useFavorites();

    // 2. Estados para el Clima y Búsqueda

    /* Almacenar las coordenadas y nombre de la ciudad buscada (Fase 1 de la API). */
    /* Almacenar los resultados de la API de Clima (Fase 2 de la API). */
    /* Controlar si se debe mostrar un spinner de carga al usuario. */
    /* Almacenar y mostrar mensajes de error al usuario. */
    const [cityData, setCityData] = useState(null);  
    const [weatherData, setWeatherData] = useState(null); 
    const [isLoading, setIsLoading] = useState(false); 
    const [error, setError] = useState(null); 

    /*IMPORTANTE| useState: Son básicamente variables dinámicas que una vez que les das o mandas un valor lo toma y le dicen a React que lo rendericen*/

    // Función auxiliar para obtener la URL del icono, esto es util si por ejemplo la API cambia su estilo de urls, desde aqui podemos hacer ajustes, ademas, sirve para encapsular en una variabla la url en lugar de en todo el codigo estar escribiendo la url toda larga.
    const getWeatherIconUrl = (iconCode) => {
        if (!iconCode) return null;
        return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
    };

    // Función para manejar errores comunes de la API, es mas que nada para codigo limpio pero tambien para manejar errores comunes en menos lineas que hacerlo especificamente para cada tipo de error.
    const handleApiError = (response) => {
        if (response.status === 401) {
            throw new Error(`Error 401: Clave API Inválida. Revisa tu clave OWM.`);
        }
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status} - ${response.statusText}`);
        }
    };
    
    // Función para alternar el estado de favorito
    const handleToggleFavorite = () => {
        //Clausula de guardia: ohh, basicamente es que si ya tenemos dato de la ciudad, proceda a mostrar el boton de añadir a favorito, pero si no, no lo hace, de esa manera evitamos que se muestre aunque demos mal la ciudad o no la tengamos. return es salir de la funcion
        if (!cityData) return;

        // Crear el objeto de ciudad con los datos necesarios para guardar
        const cityToSave = {
            name: cityData.name,
            country: cityData.country,
            lat: cityData.lat,
            lon: cityData.lon,
        };

        //Logica de Alternancia (toggle)
        if (isFavorite(cityData.name)) {
            removeFavorite(cityData.name);
            console.log("Ciudad eliminada de favoritos:", cityData.name);
        } else {
            addFavorite(cityToSave);
            console.log("Ciudad añadida a favoritos:", cityData.name);
        }
    };


    // --- FUNCIÓN FASE 2: Obtener el Clima usando Coordenadas ---
    const fetchWeather = useCallback(async (lat, lon) => {
        const weatherUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&lang=es&appid=${API_KEY}`;
        
        try {
            const response = await fetch(weatherUrl);
            handleApiError(response);
            
            const data = await response.json();
            setWeatherData(data); 
            
        } catch (err) {
            console.error("Error al obtener el pronóstico:", err);
            setError(`Fallo al obtener el clima: ${err.message}`);
            setWeatherData(null);
            setCityData(null); 
        }
    }, []); 

    // --- FUNCIÓN FASE 1: Obtener Coordenadas y luego el Clima ---
    const fetchCoordinates = useCallback(async (cityName) => {
        // Reiniciar estados para la nueva búsqueda
        setIsLoading(true);
        setError(null);
        setCityData(null); 
        setWeatherData(null); 

        const geocodingUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${cityName}&limit=1&appid=${API_KEY}`;
        
        try {
            const response = await fetch(geocodingUrl);
            handleApiError(response);
            
            const data = await response.json();
            
            if (data.length === 0) {
                throw new Error(`Results not found for: ${cityName}`);
            }

        
            const result = data[0]; //esto es solo para acceder a 1 resultado de las busquedas, porque por ejemplo si buscamos London, puede darnos London, London, UK, London, philipines, etc.
            
            //newCityData sirve para solo tomar los valores que necesitamos ya que la API podria darme 20 propiedades donde 15 son innecesarias.
            const newCityData = {
                lat: result.lat,
                lon: result.lon,
                name: result.name,
                country: result.country
            };

            //Actualiza los valores del estado con los nuevos.
            setCityData(newCityData);
            
            // Llamar a la función de clima (Fase 2)
            await fetchWeather(newCityData.lat, newCityData.lon);

        } catch (err) {
            console.error("Error en la geocodificación:", err);
            setError(`Error: ${err.message}`);
            setCityData(null);
            setWeatherData(null);
        } finally {
            setIsLoading(false);
        }
    }, [fetchWeather]); 

    
    // Función para manejar el clic en la tarjeta (Navegación)
    const handleCardClick = () => {
        if (cityData) {
            // Navigates to a dynamic path like "/city/Hermosillo"
            navigate(`/city/${encodeURIComponent(cityData.name)}`);
        }
    };

    // Ajustes en la renderización para usar los datos de /forecast (list[0])
    // Los ? son una manera de comprobar mas corta que a como se hacia antes con && o OR ||
    const currentForecast = weatherData?.list?.[0]; // El primer elemento es el clima más cercano
    const temp = currentForecast?.main?.temp;
    const weatherDescription = currentForecast?.weather?.[0]?.description;
    const weatherIcon = currentForecast?.weather?.[0]?.icon;
    const windSpeed = currentForecast?.wind?.speed;
    const humidity = currentForecast?.main?.humidity;
    const pressure = currentForecast?.main?.pressure;
    
    // Determinar si la ciudad actual es favorita para mostrar el icono correcto
    const isCurrentCityFavorite = cityData ? isFavorite(cityData.name) : false;

    return (
        <div className="min-h-screen bg-blue-200 py-12 px-4 sm:px-6 lg:px-8 shadow-lg">
            <div className="max-w-xl mx-auto bg-white pt-12 pl-8 pr-8 pb-12 rounded-2xl shadow-xl">
                <h1 className="text-4xl font-extrabold text-pink-500 text-center mb-10">
                    {/* Clima y Geolocalización Avanzada */}
                    Weather & Advanced Geolocalization
                </h1>
                
                {/* Botón de Navegación a Favoritos */}
                <div className="text-center mb-8">

                <button
                    onClick={() => navigate('/favorites')} 
                    className="px-6 py-2 bg-pink-500 text-white-600 font-semibold rounded-lg shadow-md hover:bg-pink-200 transition duration-150 transform hover:scale-105 flex items-center mx-auto justify-center hover:text-pink-900"
                >
                    <Heart className="w-5 h-5 fill-pink-600" />
                    See my Favorites
                </button>   

                </div>
                
                <Search onSearchCity={fetchCoordinates} />

                <div className="text-center p-6 bg-transparent rounded-xl">
                    {isLoading && (
                        // Indicador de carga
                        <div className="flex justify-center items-center space-x-2 text-blue-600">
                            <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <p className="font-medium">Getting data...</p>
                        </div>
                    )}

                    {error && (
                        // Mensaje de error
                        <div className="p-4 bg-red-100 border-l-4 border-red-500 text-red-700 rounded-md">
                            <p className="font-bold">Search Failed</p>
                            <p>{error}</p>
                        </div>
                    )}

                    {/* ** Mostrar Resultado Final del Clima ** */}
                    {cityData && currentForecast && !isLoading && (
                        <div 
                            className="bg-gradient-to-br from-blue-100 to-white p-8 rounded-lg shadow-2xl max-w-lg mx-auto border-t-4 border-blue-500 cursor-pointer 
                                       transform transition duration-300 hover:scale-[1.05] hover:shadow-xl relative group" // Añadimos 'relative group'
                            // El clic principal navega a la vista de detalle
                            onClick={handleCardClick} 
                        >
                            {/* Botón de Favoritos (Absoluto) */}
                            <button
                                className="absolute top-3 right-3 p-2 rounded-full bg-white/70 backdrop-blur-sm shadow-md 
                                           transition duration-150 hover:bg-white z-10"
                                onClick={(e) => {
                                    e.stopPropagation(); // Previene que el clic navegue a la vista de detalle
                                    handleToggleFavorite();
                                }}
                                title={isCurrentCityFavorite ? "Eliminar de Favoritos" : "Añadir a Favoritos"}
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
                                {/* Icono y Temperatura */}
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

                            {/* Detalles Adicionales */}
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
                                {/* Haz clic en la tarjeta para el pronóstico de 5 días. */}
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