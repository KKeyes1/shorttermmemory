// Create particles and sparkles
const createParticles = () => {
    const container = document.querySelector('.container');
    const particleCount = 20;
    
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = `${Math.random() * 100}%`;
        particle.style.top = `${Math.random() * 100}%`;
        particle.style.animationDelay = `${Math.random() * 3}s`;
        container.appendChild(particle);
    }
};

// DOM Elements
const reminderInput = document.getElementById('reminderInput');
const addButton = document.getElementById('addButton');
const reminderList = document.getElementById('reminderList');
const listCategory = document.getElementById('listCategory');
const newCategoryBtn = document.getElementById('newCategoryBtn');
const setLocationBtn = document.getElementById('setLocationBtn');
const locationStatus = document.getElementById('locationStatus');
const currentListTitle = document.getElementById('currentListTitle');

// App State
let currentCategory = 'general';
let categories = JSON.parse(localStorage.getItem('categories')) || {
    general: { items: [], location: null },
    gym: { items: ['Gym clothes', 'Water bottle', 'Towel', 'Gym shoes'], location: null },
    work: { items: ['Laptop', 'Charger', 'Notebook'], location: null },
    shopping: { items: ['Shopping bags', 'Wallet'], location: null }
};

// Location tracking state
let isTracking = false;
let watchId = null;
let isWithinThreshold = false;
let debugMode = true; // Enable debug mode
const NORMAL_THRESHOLD = 100; // meters
const DEBUG_THRESHOLD = 0.0001; // Very small for testing

// Weather functionality
const WEATHER_API_KEY = 'a4cf937f75281288793e1bb91ad80069'; // Your OpenWeatherMap API key

const getWeatherIcon = (weatherCode) => {
    // Map weather codes to emoji icons
    const iconMap = {
        'Clear': '☀️',
        'Clouds': '☁️',
        'Rain': '🌧️',
        'Snow': '🌨️',
        'Thunderstorm': '⛈️',
        'Drizzle': '🌦️',
        'Mist': '🌫️'
    };
    return iconMap[weatherCode] || '🌤️';
};

const getWeatherRecommendation = (temp, weatherMain) => {
    const recommendations = [];
    
    // Temperature-based recommendations (temperature is in Kelvin, convert to Fahrenheit)
    const tempF = (temp - 273.15) * 9/5 + 32;
    if (tempF < 70) {
        recommendations.push("Bring a light jacket");
    }
    
    // Weather-based recommendations
    switch(weatherMain) {
        case 'Rain':
        case 'Drizzle':
            recommendations.push("Bring an umbrella");
            break;
        case 'Snow':
            recommendations.push("Bring a warm coat");
            break;
    }
    
    return recommendations.length > 0 
        ? "Today's Recommendations: " + recommendations.join(", ")
        : "No special items needed for today's weather";
};

const updateWeather = async (latitude, longitude) => {
    try {
        console.log('Fetching weather for coordinates:', { latitude, longitude });
        const url = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${WEATHER_API_KEY}`;
        console.log('Weather API URL:', url);

        const response = await fetch(url);
        console.log('Weather API response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Weather API error:', errorText);
            throw new Error(`Weather data fetch failed: ${response.status} ${errorText}`);
        }
        
        const data = await response.json();
        console.log('Weather data received:', data);

        const temp = data.main.temp;
        const tempF = Math.round((temp - 273.15) * 9/5 + 32);
        const weatherMain = data.weather[0].main;
        const weatherDesc = data.weather[0].description;
        
        // Update DOM elements
        document.querySelector('.weather-icon').textContent = getWeatherIcon(weatherMain);
        document.getElementById('weatherTemp').textContent = `${tempF}°F`;
        document.getElementById('weatherDesc').textContent = weatherDesc;
        document.getElementById('weatherRecommendation').textContent = 
            getWeatherRecommendation(temp, weatherMain);
            
    } catch (error) {
        console.error('Detailed weather error:', error);
        document.getElementById('weatherInfo').innerHTML = 
            `<div class="weather-error">Unable to fetch weather data: ${error.message}</div>`;
    }
};

// Animation Functions
const animatePageLoad = () => {
    const timeline = anime.timeline({
        easing: 'easeOutExpo'
    });

    timeline
        .add({
            targets: '.animate-title',
            opacity: [0, 1],
            translateY: [-50, 0],
            duration: 1200,
            delay: 200
        })
        .add({
            targets: '.animate-in',
            opacity: [0, 1],
            translateY: [20, 0],
            duration: 800,
            delay: anime.stagger(100),
        }, '-=800');
};

const animateNewReminder = (element) => {
    return anime({
        targets: element,
        opacity: [0, 1],
        translateX: [-20, 0],
        duration: 600,
        easing: 'spring(1, 80, 10, 0)'
    }).finished;
};

const animateDeleteReminder = (element) => {
    return anime({
        targets: element,
        opacity: [1, 0],
        translateX: [0, 20],
        duration: 400,
        easing: 'easeOutCubic'
    }).finished;
};

// Function to get address from coordinates using Nominatim
const getAddressFromCoords = async (latitude, longitude) => {
    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=en`,
            {
                headers: {
                    'Accept-Language': 'en'
                }
            }
        );
        if (!response.ok) throw new Error('Failed to fetch address');
        const data = await response.json();
        
        // Extract relevant parts of the address
        const parts = [];
        if (data.address) {
            if (data.address.road) parts.push(data.address.road);
            if (data.address.suburb) parts.push(data.address.suburb);
            if (data.address.city) parts.push(data.address.city);
        }
        return parts.length > 0 ? parts.join(', ') : data.display_name.split(',').slice(0, 2).join(',');
    } catch (error) {
        console.error('Error getting address:', error);
        return 'Location set (address unavailable)';
    }
};

// Function to save app state
const saveState = () => {
    try {
        localStorage.setItem('categories', JSON.stringify(categories));
        console.log('Saved categories:', categories);
    } catch (error) {
        console.error('Error saving state:', error);
    }
};

// Function to create a reminder element
const createReminderElement = (text, index) => {
    const li = document.createElement('li');
    li.className = 'reminder-item';
    li.style.opacity = '0';
    li.style.transform = 'translateX(-20px)';
    
    const reminderText = document.createElement('span');
    reminderText.textContent = text;
    
    const deleteButton = document.createElement('button');
    deleteButton.className = 'delete-btn';
    deleteButton.textContent = 'Delete';
    deleteButton.onclick = async () => {
        await animateDeleteReminder(li);
        categories[currentCategory].items.splice(index, 1);
        saveState();
        displayReminders();
    };
    
    li.appendChild(reminderText);
    li.appendChild(deleteButton);
    
    requestAnimationFrame(() => {
        animateNewReminder(li);
    });
    
    return li;
};

// Function to display reminders
const displayReminders = () => {
    console.log('Current category:', currentCategory);
    console.log('Categories data:', categories);
    
    reminderList.innerHTML = '';
    currentListTitle.textContent = `${currentCategory.charAt(0).toUpperCase() + currentCategory.slice(1)} List`;
    
    // Ensure the category exists with proper structure
    if (!categories[currentCategory]) {
        categories[currentCategory] = {
            items: [],
            location: null
        };
        saveState();
    }

    // Display reminders
    if (Array.isArray(categories[currentCategory].items)) {
        categories[currentCategory].items.forEach((reminder, index) => {
            const reminderElement = createReminderElement(reminder, index);
            reminderList.appendChild(reminderElement);
        });
    }

    // Update location status
    const location = categories[currentCategory].location;
    updateLocationStatus(location, location !== null);
};

// Function to add a new reminder
const addReminder = () => {
    const reminderText = reminderInput.value.trim();
    
    if (reminderText) {
        // Ensure category exists
        if (!categories[currentCategory]) {
            categories[currentCategory] = {
                items: [],
                location: null
            };
        }
        
        // Add the reminder
        categories[currentCategory].items.push(reminderText);
        
        // Save state
        saveState();
        
        // Clear input
        reminderInput.value = '';
        
        // Update display
        displayReminders();
        
        // Animate input
        if (typeof anime !== 'undefined') {
            anime({
                targets: reminderInput,
                scale: [1.02, 1],
                duration: 300,
                easing: 'easeOutCubic'
            });
        }
    }
};

// Function to add new category
const addNewCategory = () => {
    const categoryName = prompt('Enter new category name:');
    if (categoryName && categoryName.trim()) {
        const normalizedName = categoryName.trim().toLowerCase();
        if (!categories[normalizedName]) {
            categories[normalizedName] = {
                items: [],
                location: null
            };
            saveState();
            
            const option = document.createElement('option');
            option.value = normalizedName;
            option.textContent = categoryName.trim();
            listCategory.appendChild(option);
            
            listCategory.value = normalizedName;
            currentCategory = normalizedName;
            displayReminders();
        } else {
            alert('Category already exists!');
        }
    }
};

// Function to calculate distance between two points
const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3;
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
};

// Function to update location status with animation
const updateLocationStatus = async (coords, isSet = false) => {
    const status = document.getElementById('locationStatus');
    
    let text = 'No location set';
    let html = text;
    
    if (isSet && coords) {
        text = await getAddressFromCoords(coords.latitude, coords.longitude);
        html = `📍 ${text} <button class="remove-location-btn">Remove Location</button>`;
    }
    
    status.innerHTML = html;
    status.className = `location-status ${isSet ? 'location-set' : ''}`;
    
    // Add event listener to remove location button if it exists
    const removeBtn = status.querySelector('.remove-location-btn');
    if (removeBtn) {
        removeBtn.addEventListener('click', () => {
            categories[currentCategory].location = null;
            saveState();
            stopLocationTracking();
            updateLocationStatus(null, false);
        });
    }
};

// Function to add debug controls
const addDebugControls = () => {
    if (!debugMode) {
        console.log('Debug mode is disabled');
        return;
    }
    console.log('Adding debug controls');

    // Remove any existing debug controls
    const existingControls = document.querySelector('.debug-controls');
    if (existingControls) {
        console.log('Removing existing debug controls');
        existingControls.remove();
    }

    const debugDiv = document.createElement('div');
    debugDiv.className = 'debug-controls';
    debugDiv.innerHTML = `
        <div style="
            position: fixed;
            bottom: 10px;
            right: 10px;
            background: rgba(0, 0, 0, 0.6);
            padding: 8px;
            border-radius: 6px;
            z-index: 1000;
            font-size: 12px;
            border: 1px solid rgba(255, 255, 255, 0.1);
        ">
            <div style="color: white; margin-bottom: 4px;">Debug Controls</div>
            <button onclick="window.simulateLocation(0, 0)" style="margin: 2px; padding: 4px 8px;">At Location</button>
            <button onclick="window.simulateLocation(0.001, 0.001)" style="margin: 2px; padding: 4px 8px;">Away</button>
        </div>
    `;
    document.body.appendChild(debugDiv);
    console.log('Debug controls added');
};

// Function to simulate location for testing
window.simulateLocation = (offsetLat = 0, offsetLng = 0) => {
    console.log('=== simulateLocation called ===');
    console.log('Offsets:', { offsetLat, offsetLng });
    console.log('Current category:', currentCategory);
    console.log('Categories state:', categories);
    
    if (!currentCategory) {
        console.error('No current category selected');
        return;
    }

    if (!categories[currentCategory]) {
        console.error('Current category not found in categories');
        return;
    }
    
    if (!categories[currentCategory].location) {
        console.log('No location set for current category:', currentCategory);
        alert('Please set a location first!');
        return;
    }

    const baseLocation = categories[currentCategory].location;
    console.log('Base location:', baseLocation);
    
    const simulatedPosition = {
        coords: {
            latitude: baseLocation.latitude + offsetLat,
            longitude: baseLocation.longitude + offsetLng,
            accuracy: 10
        }
    };
    console.log('Created simulated position:', simulatedPosition);

    // Set initial state based on whether this is "At Location" or "Away"
    const isAway = offsetLat !== 0 || offsetLng !== 0;
    console.log('Is simulating away:', isAway);
    
    checkNearbyLocation(simulatedPosition, isAway);
};

// Function to get all items for a location
const getAllItemsForLocation = (targetLocation) => {
    console.log('Getting items for location:', targetLocation);
    const allItems = [];
    
    // Helper function to compare locations
    const isSameLocation = (loc1, loc2) => {
        if (!loc1 || !loc2) {
            console.log('One of the locations is null:', { loc1, loc2 });
            return false;
        }
        // Use a small threshold for floating point comparison
        const threshold = 0.0001;
        const latMatch = Math.abs(loc1.latitude - loc2.latitude) < threshold;
        const lonMatch = Math.abs(loc1.longitude - loc2.longitude) < threshold;
        console.log('Location comparison:', {
            loc1,
            loc2,
            latMatch,
            lonMatch,
            isMatch: latMatch && lonMatch
        });
        return latMatch && lonMatch;
    };

    // Check all categories for matching locations
    Object.entries(categories).forEach(([category, data]) => {
        console.log(`Checking category ${category}:`, data);
        if (data.location) {
            const locationMatches = isSameLocation(data.location, targetLocation);
            console.log(`Location match for ${category}:`, locationMatches);
            if (locationMatches) {
                console.log(`Adding items from ${category}:`, data.items);
                data.items.forEach(item => {
                    const formattedItem = `${category}: ${item}`;
                    allItems.push(formattedItem);
                });
            }
        }
    });

    console.log('All collected items:', allItems);
    return allItems;
};

// Function to show custom modal
window.showModal = (title, items) => {
    console.log('Showing modal:', { title, items });
    
    // Get the weather recommendation
    const weatherRecommendation = document.getElementById('weatherRecommendation').textContent;
    
    // Create and animate the "Whoa!" text
    const whoaText = document.createElement('div');
    whoaText.className = 'whoa-text';
    whoaText.textContent = 'Whoa!!';
    document.body.appendChild(whoaText);

    // Create the modal
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-container">
            <div class="modal-title">
                <span>📍</span>
                <span>${title}</span>
            </div>
            <div class="modal-content">
                <div>Don't forget your things!</div>
                <ul>
                    ${items.map((item, index) => 
                        `<li style="transition-delay: ${0.1 + index * 0.05}s">${item}</li>`
                    ).join('')}
                </ul>
                <div class="weather-note">
                    ${weatherRecommendation}
                </div>
            </div>
            <div class="modal-actions">
                <button class="modal-button">Got it!</button>
            </div>
        </div>
    `;

    // Ensure the whoaText is properly centered before animation
    requestAnimationFrame(() => {
        whoaText.style.transform = 'translate(-50%, -50%) scale(0)';
        
        anime.timeline({
            easing: 'easeOutElastic(1, .5)'
        })
        .add({
            targets: whoaText,
            scale: [0, 1],
            opacity: [0, 1],
            duration: 800,
            begin: () => {
                whoaText.style.transformOrigin = 'center center';
            }
        })
        .add({
            targets: whoaText,
            scale: 1.2,
            duration: 400,
            easing: 'easeInOutQuad'
        })
        .add({
            targets: whoaText,
            scale: 0,
            opacity: 0,
            duration: 400,
            easing: 'easeInOutQuad',
            complete: () => {
                whoaText.remove();
                document.body.appendChild(modal);
                requestAnimationFrame(() => {
                    modal.classList.add('modal-show');
                });
            }
        });
    });

    // Add event listener to close button
    const closeButton = modal.querySelector('.modal-button');
    closeButton.addEventListener('click', () => {
        modal.classList.remove('modal-show');
        setTimeout(() => modal.remove(), 500);
    });
};

// Function to check if user is near the location
const checkNearbyLocation = (position, isAway = false) => {
    console.log('=== checkNearbyLocation called ===');
    console.log('Position:', position);
    console.log('Is Away:', isAway);
    
    const nearbyThreshold = debugMode ? DEBUG_THRESHOLD : NORMAL_THRESHOLD;
    console.log('Using threshold:', nearbyThreshold, 'Debug mode:', debugMode);
    
    if (!position || !position.coords) {
        console.error('Invalid position object:', position);
        return;
    }
    
    // Get all items for any location that matches the current position
    let allItems = [];
    Object.entries(categories).forEach(([category, data]) => {
        if (data.location) {
            const distance = calculateDistance(
                position.coords.latitude,
                position.coords.longitude,
                data.location.latitude,
                data.location.longitude
            );
            console.log(`Distance for ${category}:`, distance);
            
            if (distance > nearbyThreshold) {
                // If we're away from this location, add its items
                data.items.forEach(item => {
                    allItems.push(`${category}: ${item}`);
                });
            }
        }
    });
    
    console.log('All items for nearby locations:', allItems);

    // Only show modal if we're simulating being away and have items
    if (debugMode && isAway && allItems.length > 0) {
        console.log('Found items to show in modal');
        showModal('Items you might need', allItems);
    } else {
        console.log('No items to show or not simulating away');
    }
};

// Function to start location tracking
const startLocationTracking = () => {
    if (!navigator.geolocation) {
        locationStatus.textContent = 'Geolocation is not supported by your browser';
        return;
    }

    watchId = navigator.geolocation.watchPosition(
        (position) => {
            const { latitude, longitude } = position.coords;
            updateWeather(latitude, longitude); // Add weather update
            // ... rest of your existing location tracking code ...
        },
        (error) => {
            console.error('Error getting location:', error);
            locationStatus.textContent = 'Unable to retrieve your location';
        }
    );
};

// Function to stop location tracking
const stopLocationTracking = () => {
    if (watchId) {
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
    }
    isTracking = false;
    isWithinThreshold = false;
};

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    console.log('=== DOM Content Loaded ===');
    
    // Get initial elements
    console.log('Initial elements check:');
    console.log('reminderInput:', reminderInput);
    console.log('addButton:', addButton);
    console.log('reminderList:', reminderList);
    
    // Validate critical elements
    if (!reminderInput || !addButton || !reminderList) {
        console.error('Critical elements missing!');
        return;
    }
    
    // Create particles effect
    createParticles();
    
    // Animate page load
    animatePageLoad();
    
    // Display initial reminders
    displayReminders();
    
    // Add debug controls if in debug mode
    if (debugMode) {
        addDebugControls();
    }

    // Get initial weather data
    if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                updateWeather(latitude, longitude);
            },
            (error) => {
                console.error('Error getting initial location:', error);
                document.getElementById('weatherInfo').innerHTML = 
                    `<div class="weather-error">Please enable location access for weather updates</div>`;
            }
        );
    } else {
        document.getElementById('weatherInfo').innerHTML = 
            `<div class="weather-error">Geolocation is not supported by your browser</div>`;
    }

    // Set up event listeners
    console.log('Setting up event listeners');
    
    // Add reminder button
    if (addButton) {
        console.log('Adding click listener to addButton');
        addButton.onclick = function(e) {
            e.preventDefault();
            addReminder();
        };
    } else {
        console.error('Add button not found!');
    }

    // Enter key in input
    if (reminderInput) {
        console.log('Adding keypress listener to reminderInput');
        reminderInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                console.log('Enter key pressed');
                addReminder();
            }
        });
    } else {
        console.error('Reminder input not found!');
    }

    // Category change
    if (listCategory) {
        console.log('Adding change listener to listCategory');
        listCategory.addEventListener('change', async (e) => {
            currentCategory = e.target.value;
            console.log('Category changed to:', currentCategory);
            displayReminders();
            
            // Update tracking
            stopLocationTracking();
            if (categories[currentCategory].location) {
                startLocationTracking();
            }
        });
    } else {
        console.error('List category not found!');
    }

    // New category button
    if (newCategoryBtn) {
        console.log('Adding click listener to newCategoryBtn');
        newCategoryBtn.addEventListener('click', addNewCategory);
    } else {
        console.error('New category button not found!');
    }

    // Set location button
    if (setLocationBtn) {
        console.log('Adding click listener to setLocationBtn');
        setLocationBtn.addEventListener('click', () => {
            console.log('Location button clicked');
            
            // Check if geolocation is supported
            if (!('geolocation' in navigator)) {
                console.error('Geolocation is not supported by this browser');
                alert('Geolocation is not supported by your browser. Please try using a modern browser with location services enabled.');
                return;
            }

            // Check permissions first
            navigator.permissions.query({ name: 'geolocation' }).then(permissionStatus => {
                console.log('Geolocation permission status:', permissionStatus.state);
                
                if (permissionStatus.state === 'denied') {
                    alert('Location permission is denied. Please enable location access in your browser settings:\n\n' +
                          'Safari: Safari Preferences → Websites → Location\n' +
                          'System: System Settings → Privacy & Security → Location Services');
                    return;
                }

                const options = {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0
                };

                console.log('Requesting position with options:', options);
                navigator.geolocation.getCurrentPosition(
                    async (position) => {
                        console.log('Position received:', position);
                        categories[currentCategory].location = {
                            latitude: position.coords.latitude,
                            longitude: position.coords.longitude
                        };
                        
                        await updateLocationStatus(categories[currentCategory].location, true);
                        saveState();
                        
                        // Request notification permission on first interaction
                        if ('Notification' in window && Notification.permission === 'default') {
                            Notification.requestPermission();
                        }
                        
                        // Start tracking if not already tracking
                        if (!isTracking) {
                            startLocationTracking();
                        }
                    },
                    (error) => {
                        console.error('Detailed geolocation error:', {
                            code: error.code,
                            message: error.message,
                            PERMISSION_DENIED: error.PERMISSION_DENIED,
                            POSITION_UNAVAILABLE: error.POSITION_UNAVAILABLE,
                            TIMEOUT: error.TIMEOUT
                        });

                        let errorMessage = 'Unable to get your location.\n\n';
                        switch(error.code) {
                            case error.PERMISSION_DENIED:
                                errorMessage += 'Location access is denied. Please enable it in:\n\n' +
                                              '1. Safari Preferences → Websites → Location\n' +
                                              '2. System Settings → Privacy & Security → Location Services';
                                break;
                            case error.POSITION_UNAVAILABLE:
                                errorMessage += 'Location information is currently unavailable.\n\n' +
                                              'Please check:\n' +
                                              '1. Your system\'s Location Services is enabled\n' +
                                              '2. Safari has permission to access your location\n' +
                                              '3. You are connected to the internet';
                                break;
                            case error.TIMEOUT:
                                errorMessage += 'Location request timed out. Please check your internet connection and try again.';
                                break;
                            default:
                                errorMessage += 'An unknown error occurred. Please try again.';
                        }
                        alert(errorMessage);
                    },
                    options
                );
            }).catch(error => {
                console.error('Permission query error:', error);
                alert('Unable to check location permissions. Please ensure location services are enabled in your browser and system settings.');
            });
        });
    } else {
        console.error('Set location button not found!');
    }
});
