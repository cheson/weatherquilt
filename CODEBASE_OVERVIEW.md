# WeatherQuilt Codebase Overview

## Project Summary

**WeatherQuilt** is a full-stack web application that visualizes historical weather data in a quilted grid pattern. The application displays weather information (temperature, precipitation) for each day of the year, creating a visual "quilt" where each patch represents a day's weather conditions.

The project uses **React** for the frontend and **FastAPI** with **SQLAlchemy** for the backend, storing weather data from NOAA (National Oceanic and Atmospheric Administration) for Anchorage, Alaska.

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER BROWSER                             │
│                                                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    React Frontend                          │  │
│  │                  (Port 3000)                               │  │
│  │                                                            │  │
│  │  ┌──────────────┐      ┌─────────────────────────────┐   │  │
│  │  │   App.js     │──────│    WeatherQuilt Component   │   │  │
│  │  └──────────────┘      │   (Main Visualization)      │   │  │
│  │                         └────────────┬────────────────┘   │  │
│  │                                      │                     │  │
│  │                         ┌────────────▼────────────────┐   │  │
│  │                         │    Patch Component          │   │  │
│  │                         │   (Individual Day Tile)     │   │  │
│  │                         └─────────────────────────────┘   │  │
│  └────────────────────────────────┬──────────────────────────┘  │
└─────────────────────────────────────┼──────────────────────────┘
                                      │
                                HTTP/REST API
                                      │
┌─────────────────────────────────────▼──────────────────────────┐
│                      FastAPI Backend Server                      │
│                                                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                       main.py                              │  │
│  │                                                            │  │
│  │  Endpoints:                                                │  │
│  │  • GET  /                                                  │  │
│  │  • GET  /weather/day/{day}    (YYYY-MM-DD)                │  │
│  │  • GET  /weather/month/{monthNum}                          │  │
│  │  • POST /weatherByDay                                      │  │
│  │  • Background Task: fetchWeatherData() (every 60s)        │  │
│  └────────────────────────────┬──────────────────────────────┘  │
│                                │                                 │
│  ┌────────────────────────────▼──────────────────────────────┐  │
│  │                    Database Layer (db/)                    │  │
│  │                                                            │  │
│  │  ┌──────────┐  ┌────────┐  ┌─────────┐  ┌─────────────┐ │  │
│  │  │ models.py│  │crud.py │  │schema.py│  │ database.py │ │  │
│  │  │(SQLAlchemy)│ │(CRUD) │  │(Pydantic)│ │(DB Config)  │ │  │
│  │  └──────────┘  └────────┘  └─────────┘  └─────────────┘ │  │
│  │                                                            │  │
│  │  ┌──────────┐                                              │  │
│  │  │seedDB.py │  (One-time data import)                     │  │
│  │  └──────────┘                                              │  │
│  └────────────────────────────┬──────────────────────────────┘  │
└─────────────────────────────────┼──────────────────────────────┘
                                  │
                        SQLAlchemy ORM
                                  │
┌─────────────────────────────────▼──────────────────────────────┐
│                   SQLite Database                                │
│                 (weatherquilt.db)                                │
│                                                                   │
│  Table: weatherByDay                                             │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  id (PK)  │  date  │  minTemp  │  maxTemp  │  precipitation │ │
│  │  INTEGER  │ DATETIME│ NUMERIC  │  NUMERIC  │   NUMERIC(5,2) │ │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                   │
│  Data Source: noaa_anchorage.json (8,647 daily records)         │
└───────────────────────────────────────────────────────────────┘
```

---

## Directory Structure

```
weatherquilt/
│
├── client/                          # React Frontend
│   ├── public/                      # Static assets
│   │   ├── index.html
│   │   ├── favicon.ico
│   │   └── manifest.json
│   │
│   ├── src/
│   │   ├── App.js                   # Main app component
│   │   ├── App.css
│   │   ├── index.js                 # React entry point
│   │   ├── index.css
│   │   │
│   │   └── components/
│   │       ├── WeatherQuilt/        # Main visualization component
│   │       │   ├── index.js         # Grid layout (16 cols x ~23 rows)
│   │       │   ├── weatherData.js   # Weather data handler
│   │       │   └── weatherQuilt.module.css
│   │       │
│   │       └── Patch/               # Individual day tile
│   │           ├── index.js         # Single colored patch
│   │           └── patch.module.css
│   │
│   ├── package.json                 # Dependencies: React 18, classnames
│   └── .eslintrc.yml                # ESLint configuration
│
└── server/                          # Python Backend
    ├── main.py                      # FastAPI application
    │
    ├── db/                          # Database layer
    │   ├── __init__.py
    │   ├── database.py              # SQLAlchemy setup
    │   ├── models.py                # ORM models (WeatherByDay)
    │   ├── schema.py                # Pydantic schemas
    │   ├── crud.py                  # Database operations
    │   ├── seedDB.py                # Data import script
    │   ├── noaa_anchorage.json      # Raw weather data (8,647 records)
    │   └── weatherquilt.db          # SQLite database
    │
    └── weatherquiltEnv/             # Python virtual environment
        └── lib/python3.11/          # Dependencies: FastAPI, SQLAlchemy,
            └── site-packages/       #   Pydantic, Uvicorn, etc.
```

---

## Component Breakdown

### Frontend (React)

#### 1. **App.js**
- **Purpose**: Root component of the application
- **Functionality**: Renders the main `WeatherQuilt` component
- **Location**: `client/src/App.js`

#### 2. **WeatherQuilt Component**
- **Purpose**: Main visualization container
- **Functionality**: 
  - Creates a 16-column grid to display 365 days of weather data
  - Calculates rows: `numRows = 365 / 16 ≈ 23 rows`
  - Currently renders test patches (hardcoded red colors)
  - Planned: Map weather data to colors based on temperature
- **Props**: `numRows`, `numCols` (to be implemented)
- **Location**: `client/src/components/WeatherQuilt/index.js`

#### 3. **Patch Component**
- **Purpose**: Individual day visualization
- **Functionality**: 
  - Renders a single colored square representing one day
  - Takes a `color` prop to set background color
  - Will represent temperature/precipitation visually
- **Location**: `client/src/components/Patch/index.js`

#### CSS Modules
- Uses CSS Modules for scoped styling
- Grid layout: 16 columns of 30px each
- Each patch: 100px height (test styling)

---

### Backend (FastAPI + SQLAlchemy)

#### 1. **main.py** - FastAPI Application

**Endpoints:**

| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| GET | `/` | Health check | ✅ Working |
| GET | `/weather/day/{day}` | Get weather for specific day (YYYY-MM-DD) | ✅ Working |
| GET | `/weather/month/{monthNum}` | Get weather for entire month | 🔄 Planned |
| POST | `/weatherByDay` | Create new weather record | 🔄 Planned |

**Background Tasks:**
- `fetchWeatherData()`: Runs every 60 seconds to fetch new weather data from NOAA API
- Currently just logs; full implementation pending

**Planned Features (from code comments):**
- Fetch data on first of every month for previous month
- Compare latest data on startup and fetch missing ranges
- Cache/bundle data with frontend
- Handle requests for new locations

#### 2. **database.py** - Database Configuration

```python
# SQLite database connection
SQLALCHEMY_DATABASE_URL = "sqlite:///./db/weatherquilt.db"

# Creates engine and session maker
# Configured for SQLite (check_same_thread: False)
```

#### 3. **models.py** - ORM Models

**WeatherByDay Model:**

```python
Table: weatherByDay
├── id: Integer (Primary Key, Indexed)
├── date: DateTime (Indexed)
├── minTemp: Numeric
├── maxTemp: Numeric
└── precipitation: Numeric(5, 2)
```

#### 4. **schema.py** - Pydantic Schemas

Defines data validation schemas:
- `WeatherByDayBase`: Base schema with date, temps, precipitation
- `WeatherByDayCreate`: For creating new records
- `WeatherByDay`: Response model with ID (ORM mode enabled)

#### 5. **crud.py** - Database Operations

**Functions:**
- `getWeatherByDay(db, date)`: Query weather for specific day
- `getWeatherByDays(db, startDate, endDate)`: Range query (not implemented)
- `createWeatherByDay(db, data)`: Insert new weather record

#### 6. **seedDB.py** - Data Import Script

**Purpose**: One-time import of NOAA data into SQLite database

**Process:**
1. Drop and recreate database tables
2. Load `noaa_anchorage.json` (8,647 daily records)
3. Parse JSON data structure:
   ```
   [DATE, [MAX, MIN, AVG, DEPARTURE, HDD, CDD, PRECIP, NEW_SNOW, SNOW_DEPTH]]
   ```
4. Transform and insert into database
5. Handle special cases (e.g., "T" for trace precipitation → 0.01)

**Data Source:**
- NOAA RCC-ACIS API: `https://data.rcc-acis.org/StnData`
- Station: ANCthr 9 (Anchorage)
- Date Range: 2000-01-01 to 2023-09-01

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        Data Lifecycle                            │
└─────────────────────────────────────────────────────────────────┘

1. DATA SEEDING (One-time)
   ┌──────────────────┐
   │ noaa_anchorage   │
   │    .json         │
   │ (8,647 records)  │
   └────────┬─────────┘
            │
            │ seedDB.py reads and parses
            │
            ▼
   ┌──────────────────┐
   │   SQLite DB      │
   │  weatherByDay    │
   │   table          │
   └────────┬─────────┘
            │
            │ Data ready for queries
            │

2. RUNTIME DATA FLOW
   
   Browser                 FastAPI                  Database
      │                       │                         │
      │  GET /weather/day/    │                         │
      │  2023-08-15          │                         │
      ├──────────────────────>│                         │
      │                       │                         │
      │                       │  crud.getWeatherByDay() │
      │                       ├────────────────────────>│
      │                       │                         │
      │                       │  SELECT * FROM          │
      │                       │  weatherByDay WHERE     │
      │                       │  date > '2023-08-15'    │
      │                       │                         │
      │                       │<────────────────────────┤
      │                       │  WeatherByDay record    │
      │                       │                         │
      │<──────────────────────┤                         │
      │  JSON Response:       │                         │
      │  {                    │                         │
      │    id: 8592,          │                         │
      │    date: "2023-08-15",│                         │
      │    minTemp: 52,       │                         │
      │    maxTemp: 68,       │                         │
      │    precipitation: 0.15│                         │
      │  }                    │                         │
      │                       │                         │

3. BACKGROUND UPDATES (Planned)
   
   Every 60 seconds:
   ┌─────────────────────────────────────┐
   │  fetchWeatherData()                 │
   │  • Check for missing date ranges    │
   │  • Fetch from NOAA API if needed    │
   │  • Insert into database             │
   └─────────────────────────────────────┘
```

---

## Technology Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.2.0 | UI framework |
| React Scripts | 5.0.1 | Build tooling (Create React App) |
| classnames | 2.3.2 | Conditional CSS class management |
| CSS Modules | - | Scoped component styling |

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| Python | 3.11 | Programming language |
| FastAPI | 0.103.1 | Web framework |
| SQLAlchemy | 1.4.49 | ORM |
| Pydantic | 1.10.12 | Data validation |
| Uvicorn | 0.23.2 | ASGI server |
| fastapi-utils | 0.2.1 | Background tasks |

### Database
| Technology | Purpose |
|------------|---------|
| SQLite | Lightweight relational database |

### Data Source
- **NOAA RCC-ACIS API**: Historical weather data
- **Coverage**: Anchorage, Alaska (2000-2023)

---

## Key Features

### Current Implementation
1. ✅ **Backend API** - FastAPI server with weather data endpoints
2. ✅ **Database** - SQLite with SQLAlchemy ORM
3. ✅ **Data Import** - Seeded with 8,647 days of Anchorage weather data
4. ✅ **Basic Frontend** - React app with grid layout structure
5. ✅ **Query by Day** - API endpoint to retrieve weather for specific dates

### In Progress / Planned
1. 🔄 **Weather Visualization** - Color-coded patches based on temperature
2. 🔄 **Full Grid Population** - Display 365 days of weather data
3. 🔄 **Color Mapping** - Map temperature ranges to colors
4. 🔄 **Month Queries** - Aggregate monthly weather data
5. 🔄 **Automatic Updates** - Periodic fetching from NOAA API
6. 🔄 **Multiple Locations** - Support for different cities
7. 🔄 **Responsive Design** - Mobile-friendly layout

---

## Data Schema

### Weather Data Structure (NOAA JSON)

```json
{
  "data": [
    [
      "2000-01-01",
      [24],      // Max Temperature (°F)
      [8],       // Min Temperature (°F)
      [16],      // Average Temperature
      [-4.8],    // Departure from normal (91-year avg)
      [49],      // Heating Degree Days
      [0],       // Cooling Degree Days
      [0.00],    // Precipitation (inches)
      [0.0],     // New Snow (inches)
      [15]       // Snow Depth (inches)
    ],
    // ... 8,646 more records
  ]
}
```

### Database Schema

```sql
CREATE TABLE weatherByDay (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date DATETIME NOT NULL,
    minTemp NUMERIC,
    maxTemp NUMERIC,
    precipitation NUMERIC(5, 2),
    INDEX idx_date (date)
);
```

---

## API Reference

### Get Weather by Day

**Endpoint:** `GET /weather/day/{day}`

**Parameters:**
- `day`: Date string in format `YYYY-MM-DD`

**Response:**
```json
{
  "id": 8592,
  "date": "2023-08-15T00:00:00",
  "minTemp": 52,
  "maxTemp": 68,
  "precipitation": 0.15
}
```

**Error Response:**
```json
{
  "detail": "day doesn't exist"
}
```

**Status Codes:**
- `200`: Success
- `400`: Day doesn't exist

---

## Setup Instructions

### Frontend Setup

```bash
cd client
npm install
npm start
# Opens at http://localhost:3000
```

### Backend Setup

```bash
cd server

# Activate virtual environment
source weatherquiltEnv/bin/activate

# Install dependencies (if needed)
pip install -r requirements.txt

# Run database seed (one-time)
cd db
python seedDB.py

# Start server
cd ..
uvicorn main:app --reload
# Opens at http://localhost:8000
```

### Database Setup

The database is automatically created when running `seedDB.py`:

```bash
cd server/db
python seedDB.py
# Creates weatherquilt.db with 8,647 records
```

---

## Development Notes

### Current State
- Backend is functional with working API endpoints
- Frontend has basic structure but needs data integration
- Database is seeded with historical Anchorage weather data
- Background task infrastructure exists but needs implementation

### Next Steps
1. Connect React frontend to FastAPI backend
2. Implement color mapping logic for temperature visualization
3. Populate WeatherQuilt grid with actual data from API
4. Add date range queries for efficient data fetching
5. Implement monthly aggregation endpoint
6. Add automatic data fetching from NOAA API
7. Create location selection feature
8. Add user interactions (hover tooltips, date selection)

### Known Issues
- Precipitation value "T" (trace) is converted to 0.01 in seeding
- Some data points may be missing (handle gracefully in CRUD)
- Frontend currently shows test patches, not real data
- Background fetch task is placeholder (logs only)

---

## Future Enhancements

### Visualization Ideas
- **Temperature gradient**: Blue (cold) → Yellow → Red (hot)
- **Precipitation overlay**: Pattern or opacity variation
- **Year comparison**: Multiple quilts side-by-side
- **Seasonal boundaries**: Visual separators
- **Hover tooltips**: Show exact values for each day
- **Month labels**: Header row with month names
- **Legend**: Color scale reference

### Features
- **Location selector**: Dropdown for different cities
- **Date range picker**: Custom time periods
- **Statistics panel**: Monthly/yearly averages
- **Export functionality**: Download quilt as image
- **Sharing**: Generate shareable links
- **Historical comparison**: Overlay multiple years
- **Climate trends**: Show warming/cooling patterns

### Technical Improvements
- **Caching**: Redis for API response caching
- **Pagination**: Efficient large dataset handling
- **Tests**: Unit and integration tests
- **CI/CD**: Automated deployment pipeline
- **Docker**: Containerization for easy deployment
- **TypeScript**: Type safety for frontend

---

## Contributing

This appears to be a personal project in active development. Key areas that need work:

1. **Frontend-Backend Integration**: Connect React components to API
2. **Visualization Logic**: Implement temperature-to-color mapping
3. **Data Fetching**: Complete the automatic NOAA API integration
4. **UI/UX**: Improve layout, add interactivity
5. **Documentation**: Add inline code comments
6. **Testing**: Create test suites

---

## License & Data Attribution

**Weather Data Source**: NOAA (National Oceanic and Atmospheric Administration)
- Data accessed via RCC-ACIS API
- Station: ANCthr 9 (Anchorage, Alaska)
- Time Period: January 1, 2000 - September 1, 2023

---

*This documentation was generated on October 10, 2025*

