from pydantic import BaseModel
from datetime import date
from decimal import Decimal
from typing import Optional

class WeatherByDayBase(BaseModel):
    city: str
    station_id: str
    date: date
    minTemp: int
    maxTemp: int
    precipitation: Decimal

class WeatherByDayCreate(WeatherByDayBase):
    pass

class WeatherByDay(WeatherByDayBase):
    id: int
    
    class Config:
        orm_mode = True
