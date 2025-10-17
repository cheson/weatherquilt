from database import Base, engine, SessionLocal
from schema import WeatherByDayCreate

import crud, json, models
import datetime

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

SEED_DATA_FILENAME = "./noaa_anchorage.json"

if __name__ == "__main__":
    # prod step: shouldn't need to drop and create all, then load all the data everytime the server is spun up.
    # also will be migrating away from the local sqlite db 
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    f = open(SEED_DATA_FILENAME)
    fileData = json.load(f)
    weatherData = fileData["data"]

    # [DATE, [MAX, MIN, AVG, DEPARTURE, HDD, CDD, PRECIPITATION, NEW SNOW, SNOW_DEPTH]]
    print(len(weatherData))

    for day in weatherData:
        date = datetime.datetime.strptime(day[0], '%Y-%m-%d')
        maxTemp = day[1][0]
        minTemp = day[2][0]
        precipitation = day[7][0]
        if precipitation == 'T':
            precipitation = 0.01
        try:
            crud.createWeatherByDay(next(get_db()), data=WeatherByDayCreate(date=date, minTemp=minTemp, maxTemp=maxTemp, precipitation=precipitation))
        except:
            print("d", date, "min", minTemp, "max", maxTemp, "precip", precipitation)