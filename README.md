# Smart Location-Based Reminder App

A modern web application that helps you remember items based on your location and weather conditions. Never forget your gym clothes, work laptop, shopping bags, or umbrella again!

## Features

- Create multiple reminder lists (Work, Gym, Shopping, etc.)
- Add and remove items from each list
- Set location for each list
- Get notifications when entering or leaving a location
- Real-time weather updates and recommendations
- Weather-based item suggestions (e.g., umbrella for rain)
- Beautiful, modern UI with animations
- Mobile-responsive design
- Debug mode for testing location features

## Technologies Used

- Frontend:
  - HTML5
  - CSS3 (with modern features like CSS Variables, Flexbox)
  - JavaScript (ES6+)
  - Anime.js for smooth animations
  - Local Storage for data persistence
  - Geolocation API
  - OpenStreetMap (Nominatim) for reverse geocoding

- Backend:
  - Node.js
  - Express.js
  - OpenWeatherMap API integration
  - CORS enabled for local development

## Prerequisites

- Node.js (v12 or higher)
- OpenWeatherMap API key (for weather functionality)
- Modern web browser with location services enabled

## Setup

1. Clone the repository:
```bash
git clone [your-repo-url]
cd [repository-name]
```

2. Set up the backend:
```bash
cd backend
cp .env.example .env
# Edit .env and add your OpenWeatherMap API key
npm install
node server.js
```

3. Set up the frontend:
```bash
cd frontend
npm install
# The Python server must serve from the public directory
# This is configured in server.py
python3 server.py
```

4. Access the application:
- Frontend: http://localhost:8000 (serves the app from the frontend/public directory)
- Backend API: http://localhost:3001

## Environment Variables

Backend (.env):
```
API_KEY=your_openweathermap_api_key_here
PORT=3001
```

## Usage

1. Select or create a category for your reminders
2. Add items to your reminder list
3. Set a location for the list using the "Set Location" button
4. Allow location access when prompted
5. View weather information and recommendations
6. Get notified when you enter or leave the specified location

## Weather Features

- Real-time weather updates for your current location
- Temperature display in Fahrenheit
- Weather condition icons
- Smart recommendations based on weather:
  - Suggests umbrella for rain
  - Recommends jacket for cold temperatures
  - Warns about severe weather conditions

## Debug Mode

The app includes a debug mode for testing location features:
- Use the debug panel in the bottom-right corner
- "At Location" simulates entering the set location
- "Away" simulates leaving the set location

## Development

- Frontend runs on port 8000
- Backend API runs on port 3001
- CORS is enabled for local development
- Weather updates are fetched every time location changes
- Location tracking uses the browser's Geolocation API

## Common Issues

1. Frontend Serving:
   - The app files are located in the `frontend/public` directory
   - Make sure server.py is configured to serve from this directory
   - If you see a chat interface instead of the reminder app, check server.py's working directory

2. Location Services:
   - Ensure location services are enabled in your browser
   - Check system-level location permissions
   - For Safari: Safari Preferences → Websites → Location
   - For System: System Settings → Privacy & Security → Location Services

3. Weather API:
   - Verify your OpenWeatherMap API key in .env
   - Check API call limits on free tier
   - Ensure backend server is running

## License

MIT License - feel free to use this project for your own purposes! 