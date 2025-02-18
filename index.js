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

// Function to simulate location for testing
window.simulateLocation = (offsetLat = 0, offsetLng = 0) => {
    if (!categories[currentCategory].location) {
        alert('Please set a location first!');
        return;
    }

    const baseLocation = categories[currentCategory].location;
    const simulatedPosition = {
        coords: {
            latitude: baseLocation.latitude + offsetLat,
            longitude: baseLocation.longitude + offsetLng
        }
    };

    checkNearbyLocation(simulatedPosition);
};

// Function to add debug controls
const addDebugControls = () => {
    if (!debugMode) return;

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
            backdrop-filter: blur(5px);
        ">
            <h3 style="margin-bottom: 6px; color: white; font-size: 12px;">Debug</h3>
            <button onclick="simulateLocation(0, 0)" style="margin: 2px; padding: 4px 8px; font-size: 11px;">At Location</button>
            <button onclick="simulateLocation(0.001, 0.001)" style="margin: 2px; padding: 4px 8px; font-size: 11px;">Away</button>
        </div>
    `;
    document.body.appendChild(debugDiv);
};

// Function to get all items for a location
const getAllItemsForLocation = (targetLocation) => {
    const allItems = [];
    
    // Helper function to compare locations
    const isSameLocation = (loc1, loc2) => {
        if (!loc1 || !loc2) return false;
        return Math.abs(loc1.latitude - loc2.latitude) < 0.0001 && 
               Math.abs(loc1.longitude - loc2.longitude) < 0.0001;
    };

    // Check all categories for items at this location
    Object.entries(categories).forEach(([category, data]) => {
        if (data.location && isSameLocation(data.location, targetLocation)) {
            // Add all items from this category
            data.items.forEach(item => {
                const formattedItem = `${category}: ${item}`;
                if (!allItems.includes(formattedItem)) {
                    allItems.push(formattedItem);
                }
            });
        }
    });

    return allItems;
};

// Function to show custom modal
const showModal = (title, items) => {
    // Create and animate the "Whoa!" text
    const whoaText = document.createElement('div');
    whoaText.className = 'whoa-text';
    whoaText.textContent = 'Whoa!!';  // Added extra exclamation mark for emphasis
    document.body.appendChild(whoaText);

    // Create the modal but don't show it yet
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
            </div>
            <div class="modal-actions">
                <button class="modal-button">Got it!</button>
            </div>
        </div>
    `;

    // Ensure the whoaText is properly centered before animation
    requestAnimationFrame(() => {
        whoaText.style.transform = 'translate(-50%, -50%) scale(0)';
        
        // Animate the "Whoa!" text
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
                // Show the modal after "Whoa!" animation
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
const checkNearbyLocation = (position) => {
    const nearbyThreshold = debugMode ? DEBUG_THRESHOLD : NORMAL_THRESHOLD;
    const categoryLocation = categories[currentCategory].location;
    
    if (!categoryLocation) return;
    
    const distance = calculateDistance(
        position.coords.latitude,
        position.coords.longitude,
        categoryLocation.latitude,
        categoryLocation.longitude
    );

    const wasWithinThreshold = isWithinThreshold;
    isWithinThreshold = distance <= nearbyThreshold;

    // Entering the area
    if (isWithinThreshold && !wasWithinThreshold) {
        if (!localStorage.getItem(`notified_arrival_${currentCategory}`)) {
            const allItems = getAllItemsForLocation(categoryLocation);
            if (allItems.length > 0) {
                const notification = new Notification(`Welcome!`, {
                    body: `Items to remember:\n${allItems.join('\n')}`,
                    icon: '/favicon.ico'
                });
            }
            localStorage.setItem(`notified_arrival_${currentCategory}`, 'true');
        }
    }
    
    // Leaving the area
    if (!isWithinThreshold && wasWithinThreshold) {
        const allItems = getAllItemsForLocation(categoryLocation);
        if (allItems.length > 0) {
            const notification = new Notification(`Looks like you are leaving`, {
                body: `Don't forget:\n${allItems.join('\n')}`,
                icon: '/favicon.ico'
            });
            
            // Show custom modal for debug mode
            if (debugMode) {
                showModal(`Looks like you are leaving`, allItems);
            }
        }
        
        // Clear arrival notification flag when leaving
        localStorage.removeItem(`notified_arrival_${currentCategory}`);
    }
};

// Function to start location tracking
const startLocationTracking = () => {
    if (!categories[currentCategory].location) {
        return;
    }

    if ('geolocation' in navigator) {
        isTracking = true;
        isWithinThreshold = false; // Reset threshold state when starting tracking
        
        watchId = navigator.geolocation.watchPosition(
            checkNearbyLocation,
            null,
            {
                enableHighAccuracy: true,
                maximumAge: 30000,
                timeout: 27000
            }
        );
    }
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
            if ('geolocation' in navigator) {
                navigator.geolocation.getCurrentPosition(async (position) => {
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
                }, () => {
                    alert('Unable to get your location. Please check your settings and try again.');
                });
            } else {
                alert('Geolocation is not supported by your browser');
            }
        });
    } else {
        console.error('Set location button not found!');
    }
});
