import React, { useState, useEffect } from 'react';
import { HeartCrack, Wind, Droplet, Gauge } from 'lucide-react';

// CLAVE API REUTILIZADA (Deberías considerar moverla a un hook o servicio)
const API_KEY = 'acdd42a06d211c22f9c59ab85e650601'; 

// Función auxiliar para obtener la URL del icono
const getWeatherIconUrl = (iconCode) => {
    if (!iconCode) return null;
    return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
};

// Función para manejar errores comunes de la API
const handleApiError = (response) => {
    if (response.status === 401) {
        throw new Error(`Error 401: Invalid API Key.`);
    }
    if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status} - ${response.statusText}`);
    }
};


const FavoriteCityCard = ({ city, onRemove, onCardClick }) => {
    const [weatherData, setWeatherData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // useEffect para obtener el clima inmediatamente después de que el componente se monta
    useEffect(() => {
        const fetchWeather = async () => {
            const { lat, lon } = city;
            // Usamos la API de clima actual, que es más rápida que el forecast si solo queremos el clima actual
            const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&lang=es&appid=${API_KEY}`;
            
            try {
                const response = await fetch(weatherUrl);
                handleApiError(response);
                
                const data = await response.json();
                setWeatherData(data); 
            } catch (err) {
                console.error(`Error trying to get weather for ${city.name}:`, err);
                setError(`Error: ${err.message}`);
            } finally {
                setIsLoading(false);
            }
        };

        fetchWeather();
    }, [city]); // Ejecutar solo si el objeto city cambia

    // Si ocurre un error, mostramos una tarjeta de error
    if (error) {
        return (
            <div className="bg-red-50 p-6 rounded-xl shadow-lg border-l-4 border-red-500 relative">
                <h3 className="text-xl font-bold text-red-700 mb-2">{city.name}, {city.country}</h3>
                <p className="text-sm text-red-600">It was not possible to load the weather.</p>
                <button 
                    onClick={onRemove}
                    className="absolute top-3 right-3 text-red-400 hover:text-red-600 transition"
                    title="Eliminar favorito"
                >
                    <HeartCrack className="w-5 h-5" />
                </button>
            </div>
        );
    }
    
    // Indicador de carga
    if (isLoading) {
        return (
            <div className="bg-white p-6 rounded-xl shadow-lg flex items-center justify-center h-48">
                <p className="text-blue-500 animate-pulse">Loading...</p>
            </div>
        );
    }
    
    // Datos necesarios para renderizar
    const temp = weatherData?.main?.temp;
    const weatherDescription = weatherData?.weather?.[0]?.description;
    const weatherIcon = weatherData?.weather?.[0]?.icon;


    return (
        <div 
            className="bg-white p-6 rounded-xl shadow-xl border-t-4 border-pink-500 relative cursor-pointer 
                       transform transition duration-300 hover:scale-[1.03]"
            onClick={onCardClick}
        >
            {/* Botón de eliminar favorito */}
            <button
                onClick={(e) => {
                    e.stopPropagation(); // Evita que se active onCardClick
                    onRemove();
                }}
                className="absolute top-3 right-3 p-1 rounded-full bg-white/70 backdrop-blur-sm shadow-md 
                           transition duration-150 hover:bg-white z-10 text-pink-500 hover:text-red-500"
                title="Remove from favorites"
            >
                <HeartCrack className="w-6 h-6 fill-pink-500" />
            </button>

            <h3 className="text-2xl font-bold text-gray-800 mb-1">{city.name}, {city.country}</h3>
            <p className="text-sm text-gray-500 mb-4">Actual Weather</p>

            <div className="flex items-center justify-start space-x-4">
                {weatherIcon && (
                    <img 
                        src={getWeatherIconUrl(weatherIcon)} 
                        alt={weatherDescription} 
                        className="w-12 h-12"
                    />
                )}
                <div className="text-left">
                    <p className="text-4xl font-extrabold text-pink-600">
                        {Math.round(temp)}°C
                    </p>
                    <p className="text-md font-semibold text-gray-700 capitalize">
                        {weatherDescription}
                    </p>
                </div>
            </div>
            
            {/* Detalles Rápidos */}
            <div className="grid grid-cols-2 gap-2 mt-4 text-sm text-gray-600">
                <div className="flex items-center">
                    <Wind className="w-4 h-4 mr-2 text-blue-400" />
                    {weatherData?.wind?.speed.toFixed(1)} m/s
                </div>
                <div className="flex items-center">
                    <Droplet className="w-4 h-4 mr-2 text-blue-400" />
                    {weatherData?.main?.humidity}%
                </div>
                <div className="flex items-center">
                    <Gauge className="w-4 h-4 mr-2 text-blue-400" />
                    {weatherData?.main?.pressure} hPa
                </div>
            </div>
        </div>
    );
};

export default FavoriteCityCard;