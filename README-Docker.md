# WeatherQuilt Docker Deployment

This guide explains how to deploy the WeatherQuilt application using Docker.

## Quick Start

### Development Mode (Multi-container)

```bash
# Start both frontend and backend services
docker-compose up --build

# Or run in detached mode
docker-compose up --build -d
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000

### Production Mode (with Nginx proxy)

```bash
# Start all services including Nginx
docker-compose --profile production up --build

# Or run in detached mode
docker-compose --profile production up --build -d
```

The application will be available at:
- Application: http://localhost:80 (Nginx proxy)
- Backend API: http://localhost:8000

### Single Container Mode

```bash
# Build and run the single container
docker build -t weatherquilt .
docker run -p 8000:8000 weatherquilt
```

## Architecture

### Multi-container Setup (Recommended)

- **Frontend**: React app served by Nginx (port 3000)
- **Backend**: FastAPI server (port 8000)
- **Nginx** (optional): Reverse proxy for production (port 80)

### Single Container Setup

- **Combined**: React frontend served as static files by FastAPI

## Environment Variables

### Backend
- `PYTHONPATH=/app`
- `PYTHONUNBUFFERED=1`

### Frontend
- `REACT_APP_API_URL=http://localhost:8000`

## Database

The SQLite database is stored in `server/db/weatherquilt.db` and is persisted using Docker volumes.

## Development

### Rebuild after changes
```bash
docker-compose up --build
```

### View logs
```bash
docker-compose logs -f [service_name]
```

### Stop services
```bash
docker-compose down
```

### Clean up (remove volumes)
```bash
docker-compose down -v
```

## Production Deployment

1. Update CORS settings in `server/main.py` for production domains
2. Use the production profile: `docker-compose --profile production up --build`
3. Configure SSL/HTTPS at the reverse proxy level
4. Set up proper environment variables for production

## Troubleshooting

### Port conflicts
If ports 3000, 8000, or 80 are already in use, modify the port mappings in `docker-compose.yml`.

### Database issues
The database file is persisted in a Docker volume. To reset:
```bash
docker-compose down -v
docker-compose up --build
```

### Build issues
Clear Docker cache:
```bash
docker system prune -a
docker-compose up --build
```

## API Endpoints

- `GET /` - Health check
- `GET /weather/day/{day}` - Get weather for specific day
- `GET /weather/month/{year}/{month}` - Get weather for month
- `GET /weather/year/{year}` - Get weather for year
- `GET /weather/cities` - Get available cities
- `POST /weather/fetch-latest` - Fetch latest weather data
- `POST /weather/fetch-all` - Fetch all weather data

## File Structure

```
weatherquilt/
├── client/                 # React frontend
│   ├── Dockerfile         # Frontend container config
│   ├── nginx.conf         # Nginx config for frontend
│   └── .dockerignore      # Frontend ignore patterns
├── server/                # FastAPI backend
│   ├── Dockerfile         # Backend container config
│   └── .dockerignore      # Backend ignore patterns
├── docker-compose.yml     # Multi-container orchestration
├── Dockerfile            # Single container config
├── nginx.conf            # Production reverse proxy config
├── requirements.txt      # Python dependencies
├── .dockerignore         # Root ignore patterns
└── README-Docker.md      # This file
```
