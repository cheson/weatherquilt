// props
// numRows, numCols, 
import { useState, useEffect } from 'react';
import Patch from '../Patch'
import styles from './weatherQuilt.module.css'
import cx from 'classnames';


function WeatherQuilt(props) {
    const [viewMode, setViewMode] = useState('month'); // 'month' or 'year'
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [selectedCity, setSelectedCity] = useState('Anchorage, AK');
    const [availableCities, setAvailableCities] = useState([]);
    const [weatherData, setWeatherData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [selectedPatch, setSelectedPatch] = useState(null);

    // Fetch available cities on component mount
    useEffect(() => {
        fetchAvailableCities();
    }, []);

    // Fetch weather data when date, view mode, or city changes
    useEffect(() => {
        if (selectedCity) {
            fetchWeatherData();
        }
    }, [selectedDate, viewMode, selectedCity]);

    const fetchAvailableCities = async () => {
        try {
            const response = await fetch('http://localhost:8000/weather/cities');
            if (response.ok) {
                const data = await response.json();
                setAvailableCities(data.cities);
                if (data.cities.length > 0 && !selectedCity) {
                    setSelectedCity(data.cities[0]);
                }
            }
        } catch (err) {
            console.error('Error fetching cities:', err);
        }
    };

    const fetchWeatherData = async () => {
        setLoading(true);
        setError(null);
        
        const year = selectedDate.getFullYear();
        
        try {
            let url;
            const cityParam = `city=${encodeURIComponent(selectedCity)}`;
            if (viewMode === 'year') {
                url = `http://localhost:8000/weather/year/${year}?${cityParam}`;
            } else {
                const month = selectedDate.getMonth() + 1; // JavaScript months are 0-indexed
                url = `http://localhost:8000/weather/month/${year}/${month}?${cityParam}`;
            }
            
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error('Failed to fetch weather data');
            }
            
            const data = await response.json();
            setWeatherData(data);
        } catch (err) {
            setError(err.message);
            console.error('Error fetching weather data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCityChange = (e) => {
        setSelectedCity(e.target.value);
    };

    const handleDateChange = (e) => {
        if (viewMode === 'month') {
            const [year, month] = e.target.value.split('-');
            setSelectedDate(new Date(year, month - 1, 1));
        } else {
            const year = parseInt(e.target.value);
            setSelectedDate(new Date(year, 0, 1));
        }
    };

    // Format date for input value
    const getInputValue = () => {
        const year = selectedDate.getFullYear();
        if (viewMode === 'month') {
            const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
            return `${year}-${month}`;
        }
        return String(year);
    };

    const handleViewModeChange = (mode) => {
        setViewMode(mode);
    };

    const handlePatchClick = (dayData) => {
        setSelectedPatch(dayData);
    };

    const closeModal = () => {
        setSelectedPatch(null);
    };

    // Helper function to interpolate between two colors
    const interpolateColor = (color1, color2, factor) => {
        const c1 = {
            r: parseInt(color1.substring(1, 3), 16),
            g: parseInt(color1.substring(3, 5), 16),
            b: parseInt(color1.substring(5, 7), 16)
        };
        const c2 = {
            r: parseInt(color2.substring(1, 3), 16),
            g: parseInt(color2.substring(3, 5), 16),
            b: parseInt(color2.substring(5, 7), 16)
        };
        
        const r = Math.round(c1.r + (c2.r - c1.r) * factor);
        const g = Math.round(c1.g + (c2.g - c1.g) * factor);
        const b = Math.round(c1.b + (c2.b - c1.b) * factor);
        
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    };

    // Map temperature to color with granular 1-degree gradients
    const getColorForTemp = (temp) => {
        if (temp === null || temp === undefined) return '#ccc'; // Gray for missing data
        
        // Define color stops [temperature, color]
        const colorStops = [
            [-20, '#0d1b4d'], // Very deep blue (extreme cold)
            [-10, '#1a237e'], // Deep blue
            [0, '#1565C0'],   // Dark blue
            [10, '#1976D2'],  // Blue
            [20, '#2196F3'],  // Light blue
            [30, '#42A5F5'],  // Lighter blue
            [40, '#64B5F6'],  // Very light blue
            [50, '#81C784'],  // Green
            [60, '#AED581'],  // Light green
            [65, '#DCE775'],  // Yellow-green
            [70, '#FFF176'],  // Light yellow
            [75, '#FFD54F'],  // Yellow
            [80, '#FFB74D'],  // Light orange
            [85, '#FF9800'],  // Orange
            [90, '#F57C00'],  // Dark orange
            [95, '#E64A19'],  // Red-orange
            [100, '#D32F2F'], // Red
            [110, '#B71C1C']  // Dark red (extreme heat)
        ];
        
        // Find the two color stops to interpolate between
        for (let i = 0; i < colorStops.length - 1; i++) {
            const [temp1, color1] = colorStops[i];
            const [temp2, color2] = colorStops[i + 1];
            
            if (temp >= temp1 && temp <= temp2) {
                // Calculate interpolation factor (0 to 1)
                const factor = (temp - temp1) / (temp2 - temp1);
                return interpolateColor(color1, color2, factor);
            }
        }
        
        // Handle edge cases
        if (temp < colorStops[0][0]) return colorStops[0][1]; // Colder than coldest
        if (temp > colorStops[colorStops.length - 1][0]) return colorStops[colorStops.length - 1][1]; // Hotter than hottest
        
        return '#ccc'; // Fallback
    };

    // Map precipitation to color
    const getColorForPrecip = (precip) => {
        if (precip === null || precip === undefined) return '#f5f5f5'; // Almost white for no data
        
        const precipValue = parseFloat(precip);
        
        // Define precipitation color stops [inches, color]
        const precipStops = [
            [0, '#f5f5f5'],      // Almost white - no precipitation
            [0.01, '#e3f2fd'],   // Very light blue - trace
            [0.1, '#bbdefb'],    // Light blue - light rain
            [0.25, '#90caf9'],   // Medium light blue
            [0.5, '#64b5f6'],    // Medium blue - moderate rain
            [0.75, '#42a5f5'],   // Darker blue
            [1.0, '#2196f3'],    // Blue - heavy rain
            [1.5, '#1976d2'],    // Dark blue
            [2.0, '#1565c0'],    // Very dark blue - very heavy rain
            [3.0, '#0d47a1']     // Deep blue - extreme precipitation
        ];
        
        // Find the two color stops to interpolate between
        for (let i = 0; i < precipStops.length - 1; i++) {
            const [precip1, color1] = precipStops[i];
            const [precip2, color2] = precipStops[i + 1];
            
            if (precipValue >= precip1 && precipValue <= precip2) {
                // Calculate interpolation factor (0 to 1)
                const factor = (precipValue - precip1) / (precip2 - precip1);
                return interpolateColor(color1, color2, factor);
            }
        }
        
        // Handle edge cases
        if (precipValue > precipStops[precipStops.length - 1][0]) {
            return precipStops[precipStops.length - 1][1]; // More than max
        }
        
        return precipStops[0][1]; // Default to no precipitation color
    };

    let numCols = 16;
    
    // Generate gradient bar for legend (showing color for each degree in range)
    const generateGradientBar = () => {
        const gradientStops = [];
        for (let temp = -20; temp <= 110; temp += 2) {
            const color = getColorForTemp(temp);
            const position = ((temp + 20) / 130) * 100; // Normalize to 0-100%
            gradientStops.push(`${color} ${position}%`);
        }
        return `linear-gradient(to right, ${gradientStops.join(', ')})`;
    };
    
    // Key temperature markers for the legend
    const temperatureMarkers = [-20, -10, 0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110];
    
    // Generate gradient bar for precipitation legend
    const generatePrecipGradientBar = () => {
        const gradientStops = [];
        for (let precip = 0; precip <= 3; precip += 0.1) {
            const color = getColorForPrecip(precip);
            const position = (precip / 3) * 100; // Normalize to 0-100%
            gradientStops.push(`${color} ${position}%`);
        }
        return `linear-gradient(to right, ${gradientStops.join(', ')})`;
    };
    
    // Key precipitation markers for the legend (in inches)
    const precipitationMarkers = [0, 0.25, 0.5, 0.75, 1.0, 1.5, 2.0, 3.0];
    
    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1>Weather Quilt</h1>
                
                <div className={styles.citySelector}>
                    <label htmlFor="city-picker">Select City: </label>
                    <select 
                        id="city-picker"
                        value={selectedCity}
                        onChange={handleCityChange}
                        className={styles.cityDropdown}
                    >
                        {availableCities.map((city) => (
                            <option key={city} value={city}>
                                {city}
                            </option>
                        ))}
                    </select>
                </div>
                
                <div className={styles.viewModeToggle}>
                    <button 
                        className={cx(styles.toggleButton, { [styles.active]: viewMode === 'month' })}
                        onClick={() => handleViewModeChange('month')}
                    >
                        Monthly View
                    </button>
                    <button 
                        className={cx(styles.toggleButton, { [styles.active]: viewMode === 'year' })}
                        onClick={() => handleViewModeChange('year')}
                    >
                        Yearly View
                    </button>
                </div>

                <div className={styles.datePicker}>
                    {viewMode === 'month' ? (
                        <>
                            <label htmlFor="date-picker">Select Month: </label>
                            <input 
                                id="date-picker"
                                type="month" 
                                value={getInputValue()}
                                onChange={handleDateChange}
                                min="2020-01"
                                max="2025-12"
                            />
                        </>
                    ) : (
                        <>
                            <label htmlFor="date-picker">Select Year: </label>
                            <input 
                                id="date-picker"
                                type="number" 
                                value={getInputValue()}
                                onChange={handleDateChange}
                                min="2020"
                                max="2025"
                                className={styles.yearInput}
                            />
                        </>
                    )}
                </div>
            </div>
            
            <div className={styles.legendsContainer}>
                <div className={styles.legend}>
                    <h3>🌡️ Temperature Scale</h3>
                    <p className={styles.legendDescription}>Average Daily Temperature (°F)</p>
                    <div className={styles.gradientBar} style={{ background: generateGradientBar() }}></div>
                    <div className={styles.temperatureMarkers}>
                        {temperatureMarkers.map((temp, index) => (
                            <div key={index} className={styles.marker}>
                                <div className={styles.markerLine}></div>
                                <div className={styles.markerLabel}>{temp}°F</div>
                            </div>
                        ))}
                    </div>
                    <div className={styles.legendLabels}>
                        <span>Very Cold</span>
                        <span>Cold</span>
                        <span>Cool</span>
                        <span>Mild</span>
                        <span>Warm</span>
                        <span>Hot</span>
                        <span>Very Hot</span>
                    </div>
                </div>

                <div className={styles.legend}>
                    <h3>💧 Precipitation Scale</h3>
                    <p className={styles.legendDescription}>Daily Precipitation (inches)</p>
                    <div className={styles.gradientBar} style={{ background: generatePrecipGradientBar() }}></div>
                    <div className={styles.temperatureMarkers}>
                        {precipitationMarkers.map((precip, index) => (
                            <div key={index} className={styles.marker}>
                                <div className={styles.markerLine}></div>
                                <div className={styles.markerLabel}>{precip}&quot;</div>
                            </div>
                        ))}
                    </div>
                    <div className={styles.legendLabels}>
                        <span>None</span>
                        <span>Trace</span>
                        <span>Light</span>
                        <span>Moderate</span>
                        <span>Heavy</span>
                        <span>Very Heavy</span>
                        <span>Extreme</span>
                    </div>
                </div>
            </div>
            
            {loading && <div className={styles.loading}>Loading weather data...</div>}
            {error && <div className={styles.error}>Error: {error}</div>}
            
            {!loading && !error && weatherData.length > 0 && (
                <>
                    <div className={styles.quiltInfo}>
                        {viewMode === 'year' ? (
                            <>Showing {weatherData.length} days for {selectedDate.getFullYear()}</>
                        ) : (
                            <>Showing {weatherData.length} days for {selectedDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</>
                        )}
                    </div>
                    
                    <div className={styles.quiltsContainer}>
                        {/* Temperature Quilt */}
                        <div className={styles.quiltSection}>
                            <h3 className={styles.quiltTitle}>🌡️ Temperature Quilt</h3>
                            <div className={cx(styles.grid, { [styles.yearGrid]: viewMode === 'year' })}>
                                {weatherData.map((day, index) => {
                                    const avgTemp = (parseFloat(day.maxTemp) + parseFloat(day.minTemp)) / 2;
                                    const tempColor = getColorForTemp(avgTemp);
                                    const precipColor = getColorForPrecip(day.precipitation);
                                    const date = new Date(day.date);
                                    
                                    return (
                                        <Patch 
                                            key={index} 
                                            maxColor={tempColor}
                                            minColor={precipColor}
                                            date={date.toLocaleDateString()}
                                            minTemp={day.minTemp}
                                            maxTemp={day.maxTemp}
                                            precipitation={day.precipitation}
                                            viewMode={viewMode}
                                            displayMode="temperature"
                                            onClick={() => handlePatchClick({
                                                date: date.toLocaleDateString('en-US', { 
                                                    weekday: 'long', 
                                                    year: 'numeric', 
                                                    month: 'long', 
                                                    day: 'numeric' 
                                                }),
                                                minTemp: day.minTemp,
                                                maxTemp: day.maxTemp,
                                                avgTemp: avgTemp.toFixed(1),
                                                precipitation: day.precipitation
                                            })}
                                        />
                                    );
                                })}
                            </div>
                        </div>

                        {/* Precipitation Quilt */}
                        <div className={styles.quiltSection}>
                            <h3 className={styles.quiltTitle}>💧 Precipitation Quilt</h3>
                            <div className={cx(styles.grid, { [styles.yearGrid]: viewMode === 'year' })}>
                                {weatherData.map((day, index) => {
                                    const avgTemp = (parseFloat(day.maxTemp) + parseFloat(day.minTemp)) / 2;
                                    const tempColor = getColorForTemp(avgTemp);
                                    const precipColor = getColorForPrecip(day.precipitation);
                                    const date = new Date(day.date);
                                    
                                    return (
                                        <Patch 
                                            key={index} 
                                            maxColor={tempColor}
                                            minColor={precipColor}
                                            date={date.toLocaleDateString()}
                                            minTemp={day.minTemp}
                                            maxTemp={day.maxTemp}
                                            precipitation={day.precipitation}
                                            viewMode={viewMode}
                                            displayMode="precipitation"
                                            onClick={() => handlePatchClick({
                                                date: date.toLocaleDateString('en-US', { 
                                                    weekday: 'long', 
                                                    year: 'numeric', 
                                                    month: 'long', 
                                                    day: 'numeric' 
                                                }),
                                                minTemp: day.minTemp,
                                                maxTemp: day.maxTemp,
                                                avgTemp: avgTemp.toFixed(1),
                                                precipitation: day.precipitation
                                            })}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </>
            )}

            {selectedPatch && (
                <div className={styles.modalOverlay} onClick={closeModal}>
                    <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <button className={styles.closeButton} onClick={closeModal}>×</button>
                        <h2>Weather Details</h2>
                        <div className={styles.modalContent}>
                            <div className={styles.detailRow}>
                                <span className={styles.label}>Date:</span>
                                <span className={styles.value}>{selectedPatch.date}</span>
                            </div>
                            <div className={styles.detailRow}>
                                <span className={styles.label}>Average Temperature:</span>
                                <span className={styles.value}>{selectedPatch.avgTemp}°F</span>
                            </div>
                            <div className={styles.detailRow}>
                                <span className={styles.label}>High Temperature:</span>
                                <span className={styles.value}>{selectedPatch.maxTemp}°F</span>
                            </div>
                            <div className={styles.detailRow}>
                                <span className={styles.label}>Low Temperature:</span>
                                <span className={styles.value}>{selectedPatch.minTemp}°F</span>
                            </div>
                            <div className={styles.detailRow}>
                                <span className={styles.label}>Precipitation:</span>
                                <span className={styles.value}>{selectedPatch.precipitation}&quot;</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default WeatherQuilt;
