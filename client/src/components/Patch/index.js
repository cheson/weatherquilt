import styles from './patch.module.css'

function Patch(props) {
    const { color, date, minTemp, maxTemp, precipitation, viewMode, onClick, minColor, maxColor, displayMode } = props;
    const isYearView = viewMode === 'year';
    const avgTemp = ((parseFloat(maxTemp) + parseFloat(minTemp)) / 2).toFixed(1);
    
    // Determine background color based on display mode
    let backgroundColor;
    let tooltipText;
    
    if (displayMode === 'temperature') {
        backgroundColor = maxColor; // maxColor now holds the temperature color
        tooltipText = `${date}\nAvg Temp: ${avgTemp}°F (Min: ${minTemp}°F, Max: ${maxTemp}°F)`;
    } else if (displayMode === 'precipitation') {
        backgroundColor = minColor; // minColor now holds the precipitation color
        tooltipText = `${date}\nPrecipitation: ${precipitation}"`;
    } else {
        // Split mode (original)
        tooltipText = `${date}\nAvg Temp: ${avgTemp}°F (Min: ${minTemp}°F, Max: ${maxTemp}°F)\nPrecip: ${precipitation}"`;
    }
    
    return (
        <div 
            className={`${styles.patch} ${isYearView ? styles.yearPatch : ''}`}
            style={displayMode ? { backgroundColor } : {}}
            title={tooltipText}
            onClick={onClick}
        >
            {!displayMode && (
                <>
                    <div className={styles.triangleTop} style={{ borderTopColor: maxColor }}></div>
                    <div className={styles.triangleBottom} style={{ borderBottomColor: minColor }}></div>
                </>
            )}
            {!isYearView && (
                <div className={styles.content}>
                    <div className={styles.day}>{new Date(date).getDate()}</div>
                </div>
            )}
        </div>
    );
  }

export default Patch;
