# Smart Location-Based Reminder App

A modern web application that helps you remember items based on your location. Never forget your gym clothes, work laptop, or shopping bags again!

## Features

- Create multiple reminder lists (Work, Gym, Shopping, etc.)
- Add and remove items from each list
- Set location for each list
- Get notifications when entering or leaving a location
- Beautiful, modern UI with animations
- Mobile-responsive design
- Debug mode for testing location features

## Technologies Used

- HTML5
- CSS3 (with modern features like CSS Variables, Flexbox)
- JavaScript (ES6+)
- Anime.js for smooth animations
- Local Storage for data persistence
- Geolocation API
- OpenStreetMap (Nominatim) for reverse geocoding

## Setup

1. Clone the repository:
```bash
git clone [your-repo-url]
cd [repository-name]
```

2. Start a local server:
```bash
python3 -m http.server 8000
```

3. Open in your browser:
```
http://localhost:8000
```

## Usage

1. Select or create a category for your reminders
2. Add items to your reminder list
3. Set a location for the list using the "Set Location" button
4. Get notified when you enter or leave the specified location

## Debug Mode

The app includes a debug mode for testing location features:
- Use the debug panel in the bottom-right corner
- "At Location" simulates entering the set location
- "Away" simulates leaving the set location

## License

MIT License - feel free to use this project for your own purposes! 