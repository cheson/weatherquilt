from sqlalchemy.orm import Session
from datetime import date
from typing import Optional

import db.models as models
import db.schema as schema

def getWeatherByDay(db: Session, day: date, city: str = "Anchorage, AK"):
    return db.query(models.WeatherByDay).filter(
        models.WeatherByDay.date == day,
        models.WeatherByDay.city == city
    ).first()

# get weather by range of dates

def getWeatherByDays(db: Session, startDate: date, endDate: date, city: str = "Anchorage, AK"):
    return db.query(models.WeatherByDay).filter(
        models.WeatherByDay.date >= startDate,
        models.WeatherByDay.date <= endDate,
        models.WeatherByDay.city == city
    ).order_by(models.WeatherByDay.date).all()

def getAvailableCities(db: Session):
    return db.query(models.WeatherByDay.city).distinct().all()

def createWeatherByDay(db: Session, data: schema.WeatherByDayCreate):
    weatherByDay = models.WeatherByDay(**data.dict())
    db.add(weatherByDay)
    db.commit()
    db.refresh(weatherByDay)
    return weatherByDay