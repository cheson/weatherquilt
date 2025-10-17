import React from 'react';
import styles from './about.module.css';

function About() {
    return (
        <div className={styles.container}>
            <div className={styles.content}>
                <h1>About Weather Quilt</h1>
                
                <section className={styles.section}>
                    <h2>What is Weather Quilt?</h2>
                    <p>
                        Weather Quilt is an interactive data visualization tool that transforms weather data 
                        into beautiful quilted patterns. Each &quot;patch&quot; in the quilt represents a single day, 
                        with colors indicating temperature and precipitation levels.
                    </p>
                    <p>
                        By viewing weather data as a quilt, patterns emerge that might be missed in traditional 
                        charts and graphs. Cold snaps, heat waves, rainy seasons, and dry spells become visually 
                        apparent in the fabric of the quilt.
                    </p>
                </section>

                <section className={styles.section}>
                    <h2>How to Use</h2>
                    <div className={styles.instructions}>
                        <div className={styles.step}>
                            <div className={styles.stepNumber}>1</div>
                            <div className={styles.stepContent}>
                                <h3>Choose a Location</h3>
                                <p>Select from available cities using the dropdown menu</p>
                            </div>
                        </div>
                        <div className={styles.step}>
                            <div className={styles.stepNumber}>2</div>
                            <div className={styles.stepContent}>
                                <h3>Select View Mode</h3>
                                <p>Switch between monthly and yearly views to see different time scales</p>
                            </div>
                        </div>
                        <div className={styles.step}>
                            <div className={styles.stepNumber}>3</div>
                            <div className={styles.stepContent}>
                                <h3>Pick a Date</h3>
                                <p>Use the date picker to explore historical weather patterns</p>
                            </div>
                        </div>
                        <div className={styles.step}>
                            <div className={styles.stepNumber}>4</div>
                            <div className={styles.stepContent}>
                                <h3>Interpret the Colors</h3>
                                <p>
                                    Reference the temperature and precipitation legends to understand what each color represents. 
                                    Toggle between fixed and dynamic range for temperature to see patterns in different ways.
                                </p>
                            </div>
                        </div>
                        <div className={styles.step}>
                            <div className={styles.stepNumber}>5</div>
                            <div className={styles.stepContent}>
                                <h3>Click for Details</h3>
                                <p>Click any patch to see detailed weather information for that specific day</p>
                            </div>
                        </div>
                    </div>
                </section>

                <section className={styles.section}>
                    <h2>Understanding the Quilts</h2>
                    <div className={styles.twoColumn}>
                        <div className={styles.column}>
                            <h3>🌡️ Temperature Quilt</h3>
                            <p>
                                Colors range from deep blue (very cold) through green and yellow to 
                                deep red (very hot). Each patch shows the average daily temperature, 
                                calculated from the day&apos;s high and low.
                            </p>
                            <ul>
                                <li><strong>Fixed Range:</strong> Uses -20°F to 110°F, allowing comparison across different time periods</li>
                                <li><strong>Dynamic Range:</strong> Adjusts to show the full color spectrum for the current data range</li>
                            </ul>
                        </div>
                        <div className={styles.column}>
                            <h3>💧 Precipitation Quilt</h3>
                            <p>
                                Colors range from almost white (no precipitation) through increasingly 
                                darker shades of blue as rainfall increases. Each patch represents the 
                                total precipitation for that day in inches.
                            </p>
                            <ul>
                                <li><strong>Trace:</strong> Very light blue indicates minimal precipitation</li>
                                <li><strong>Heavy Rain:</strong> Deep blue shows days with significant rainfall</li>
                            </ul>
                        </div>
                    </div>
                </section>

                <section className={styles.section}>
                    <h2>Data Source</h2>
                    <p>
                        Weather Quilt uses historical weather data from <strong>NOAA</strong> (National Oceanic 
                        and Atmospheric Administration) accessed through the <strong>RCC-ACIS API</strong>. 
                        The data includes:
                    </p>
                    <ul className={styles.dataList}>
                        <li>Daily maximum temperatures</li>
                        <li>Daily minimum temperatures</li>
                        <li>Daily precipitation totals</li>
                        <li>Coverage from 2000 to present</li>
                    </ul>
                    <p className={styles.attribution}>
                        Data provided by NOAA Regional Climate Centers and their Applied Climate Information System.
                    </p>
                </section>

                <section className={styles.section}>
                    <h2>Technology Stack</h2>
                    <div className={styles.twoColumn}>
                        <div className={styles.column}>
                            <h3>Frontend</h3>
                            <ul>
                                <li><strong>React 18</strong> - UI framework</li>
                                <li><strong>CSS Modules</strong> - Scoped styling</li>
                                <li><strong>React Router</strong> - Navigation</li>
                                <li><strong>classnames</strong> - Dynamic CSS classes</li>
                            </ul>
                        </div>
                        <div className={styles.column}>
                            <h3>Backend</h3>
                            <ul>
                                <li><strong>Python 3.11</strong> - Programming language</li>
                                <li><strong>FastAPI</strong> - Web framework</li>
                                <li><strong>SQLAlchemy</strong> - ORM for database operations</li>
                                <li><strong>SQLite</strong> - Database storage</li>
                            </ul>
                        </div>
                    </div>
                </section>

                <section className={styles.section}>
                    <h2>The Inspiration</h2>
                    <p>
                        Traditional weather visualizations like line graphs and bar charts are excellent for 
                        showing trends, but they can make it difficult to see the bigger picture. Weather Quilt 
                        was inspired by the centuries-old tradition of quilting, where individual pieces come 
                        together to create a larger pattern.
                    </p>
                    <p>
                        Just as a quilter might use different fabrics to create patterns, Weather Quilt uses 
                        colors to represent weather conditions. The result is a tapestry of data that reveals 
                        seasonal patterns, unusual weather events, and long-term climate trends in an intuitive, 
                        visual way.
                    </p>
                </section>

                <section className={styles.section}>
                    <h2>Future Features</h2>
                    <p>Weather Quilt is continuously evolving. Planned enhancements include:</p>
                    <ul className={styles.featureList}>
                        <li>🌍 Additional locations from around the world</li>
                        <li>📊 Statistical analysis tools and climate trend visualization</li>
                        <li>📤 Export quilts as images for sharing and printing</li>
                        <li>🔍 Compare multiple years side-by-side</li>
                        <li>❄️ Snow depth and other weather variables</li>
                        <li>🎨 Customizable color schemes</li>
                        <li>📱 Enhanced mobile experience</li>
                    </ul>
                </section>

                <section className={styles.section}>
                    <h2>Questions?</h2>
                    <p>
                        Weather Quilt is an open-source project created to make weather data more accessible 
                        and engaging. Whether you&apos;re a weather enthusiast, researcher, educator, or just 
                        curious about climate patterns, we hope this tool helps you see weather data in a new light.
                    </p>
                </section>
            </div>
        </div>
    );
}

export default About;

