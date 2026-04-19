# 🚗 Smart Parking AI Agent Website

A modern web application that uses AI to help users find the best parking spots based on distance, price, and availability.

## Features

### 🤖 AI-Powered Recommendations
- Smart scoring algorithm: `score = distance * 2 + price - available_slots`
- Real-time best parking suggestions with explanations
- Dynamic decision-making visible in the UI

### 🌐 Modern Web Interface
- Responsive design with blue/green theme
- Real-time updates every 5 seconds
- Interactive cards with soft shadows
- Mobile-friendly responsive layout

### 📊 Live Data & Predictions
- Dynamic parking slot updates
- Traffic prediction based on time of day
- Live availability indicators
- Auto-refresh functionality

### 🎯 Smart Filtering
- Filter by maximum price
- Filter by maximum distance
- Reset filters functionality

### 📱 Booking System
- Mock booking with cost calculation
- Duration selection (1-24 hours)
- Booking confirmation with ID
- Success notifications

## Installation & Setup

1. **Clone or download the project**
   ```bash
   cd ai_smartparking
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Run the application**
   ```bash
   python main_app.py
   ```

4. **Open your browser**
   ```
   http://localhost:5000
   ```

## Project Structure

```
ai_smartparking/
├── main_app.py          # Flask backend with AI logic
├── templates/
│   └── index.html       # Main HTML template
├── static/
│   ├── style.css        # Modern CSS styling
│   └── script.js        # JavaScript functionality
├── requirements.txt     # Python dependencies
└── README.md           # This file
```

## API Endpoints

- `GET /` - Main homepage
- `GET /parkings` - Get all parking data (JSON)
- `GET /best-parking` - Get AI recommendation (JSON)
- `GET /predict` - Get traffic prediction (JSON)
- `POST /book` - Book parking spot (JSON)

## AI Algorithm

The AI uses a scoring system where **lower scores = better parking**:

```python
score = (distance * 2) + price - available_slots
```

**Factors considered:**
- **Distance** (×2 weight) - Closer is better
- **Price** - Cheaper is better  
- **Availability** - More slots is better

## Features in Action

### 🎯 AI Recommendations
- Click "Find Best Parking (AI)" to get smart suggestions
- See why AI chose that parking spot
- Visual highlighting of recommended parking

### 📊 Live Updates
- Parking slots change every 5 seconds
- Traffic predictions based on current time
- Real-time availability bars

### 🔍 Smart Filters
- Adjust price and distance sliders
- See filtered results instantly
- Reset to show all options

### 📱 Easy Booking
- Click "Book Now" on any available spot
- Select duration (1-24 hours)
- See total cost calculation
- Get booking confirmation

## Time-Based Predictions

- **6 PM - 8 PM**: High Traffic (85% confidence)
- **7-9 AM, 5-7 PM**: Moderate Traffic (70% confidence)
- **Other times**: Available (90% confidence)

## Technologies Used

- **Backend**: Python Flask
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Styling**: Modern CSS with gradients and animations
- **Icons**: Font Awesome
- **Features**: Real-time updates, responsive design

## Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge

## Development Notes

- Auto-refresh pauses when tab is not visible
- Slots never go below 0 or above total capacity
- All booking is mock (no real payment processing)
- AI explanations are generated dynamically

## Future Enhancements

- Real parking API integration
- User authentication
- Payment processing
- GPS location services
- Push notifications
- Historical data analysis

---

**Enjoy finding the perfect parking spot with AI! 🚗🤖**