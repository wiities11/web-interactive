import "dotenv/config";
import express, { Request, Response } from "express";
import path from "path";

const app = express();
const port = 3000;

app.use(express.static(path.join(__dirname, "../public")));

type WeatherResp = {
    coord: { lat: number; lon: number };
    main: { temp: number };
    weather: { description: string }[];
};

type PollutionResp = {
    list: { main: { aqi: number }; components: { pm2_5: number; pm10: number} }[];
};
app.get("/api/weather", async (req: Request, res: Response) => {
    const city = req.query.city as string;
    const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${process.env.OPENWEATHER_KEY}&units=metric`;
    try {
        const weatherRes = await fetch(weatherUrl);
        const weatherData = (await weatherRes.json()) as WeatherResp;

        const { lat, lon } = weatherData.coord;
        const pollutionUrl = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${process.env.OPENWEATHER_KEY}`;
        const pollutionRes = await fetch(pollutionUrl);
        const pollutionData = (await pollutionRes.json()) as PollutionResp;

        if (!pollutionData.list?.[0] || !weatherData.weather?.[0]) {
            return res.status(500).json({ message: "Invalid weather or pollution data" });
        }

        const aqi = pollutionData.list[0].main.aqi;
        const pm25 = pollutionData.list[0].components.pm2_5;
        const pm10 = pollutionData.list[0].components.pm10;

        return res.json({
            city : city,
            temp : weatherData.main.temp,
            desc : weatherData.weather[0].description,
            iconUrl: "https://openweathermap.org/img/wn/04d@2x.png",
            aqi : aqi,
            pm25 : pm25,
            pm10 : pm10
        });
        
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error fetching weather data" });
    }
});

app.listen(port, () => console.log(`http://localhost:${port}`));