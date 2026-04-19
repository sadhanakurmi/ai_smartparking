from flask import Flask, jsonify, render_template, request
import random
import json
from datetime import datetime, timedelta

app = Flask(__name__)

# Mock parking data - this will be updated dynamically
parking_data = [
    {"id": 1, "name": "Downtown Plaza", "distance": 0.5, "price": 8, "available_slots": 15, "total_slots": 20},
    {"id": 2, "name": "City Mall", "distance": 1.2, "price": 5, "available_slots": 8, "total_slots": 25},
    {"id": 3, "name": "Business Center", "distance": 0.8, "price": 12, "available_slots": 3, "total_slots": 15},
    {"id": 4, "name": "Airport Terminal", "distance": 3.5, "price": 15, "available_slots": 22, "total_slots": 50},
    {"id": 5, "name": "University Campus", "distance": 2.1, "price": 3, "available_slots": 12, "total_slots": 30},
    {"id": 6, "name": "Sports Stadium", "distance": 1.8, "price": 6, "available_slots": 18, "total_slots": 40}
]

# Store user bookings (in production, this would be in a database)
user_bookings = []

def update_parking_slots():
    """Randomly update available slots to simulate real-time changes"""
    for parking in parking_data:
        # Random change between -2 to +3 slots
        change = random.randint(-2, 3)
        new_slots = parking["available_slots"] + change
        # Ensure slots never go below 0 or above total_slots
        parking["available_slots"] = max(0, min(new_slots, parking["total_slots"]))

def calculate_ai_score(parking):
    """
    AI SCORING ALGORITHM:
    Lower score = Better parking option
    Formula: distance * 2 + price - available_slots
    """
    score = (parking["distance"] * 2) + parking["price"] - parking["available_slots"]
    return round(score, 2)

def get_best_parking_explanation(best_parking, all_parkings):
    """Generate AI explanation for why this parking is best"""
    reasons = []
    
    # Check if it's the closest
    closest_distance = min(p["distance"] for p in all_parkings)
    if best_parking["distance"] == closest_distance:
        reasons.append("closest to destination")
    
    # Check if it's the cheapest
    cheapest_price = min(p["price"] for p in all_parkings)
    if best_parking["price"] == cheapest_price:
        reasons.append("most affordable option")
    
    # Check availability
    if best_parking["available_slots"] > 10:
        reasons.append("high availability")
    elif best_parking["available_slots"] > 5:
        reasons.append("good availability")
    
    # If no specific reasons, use score-based explanation
    if not reasons:
        reasons.append("best overall score considering distance, price, and availability")
    
    return reasons

@app.route('/')
def home():
    """Render the main homepage"""
    return render_template('index.html')

@app.route('/parkings')
def get_parkings():
    """Return all parking data with dynamic updates"""
    # Update slots randomly to simulate real-time changes
    update_parking_slots()
    
    # Add AI scores to each parking
    parkings_with_scores = []
    for parking in parking_data:
        parking_copy = parking.copy()
        parking_copy["ai_score"] = calculate_ai_score(parking)
        parkings_with_scores.append(parking_copy)
    
    return jsonify({
        "parkings": parkings_with_scores,
        "timestamp": datetime.now().strftime("%H:%M:%S")
    })

@app.route('/best-parking')
def get_best_parking():
    """AI Agent: Return the best parking option with explanation"""
    # Update slots first
    update_parking_slots()
    
    # Calculate scores for all parkings
    scored_parkings = []
    for parking in parking_data:
        parking_with_score = parking.copy()
        parking_with_score["ai_score"] = calculate_ai_score(parking)
        scored_parkings.append(parking_with_score)
    
    # Find best parking (lowest score)
    best_parking = min(scored_parkings, key=lambda x: x["ai_score"])
    
    # Generate AI explanation
    reasons = get_best_parking_explanation(best_parking, parking_data)
    
    return jsonify({
        "best_parking": best_parking,
        "ai_explanation": {
            "reasons": reasons,
            "score": best_parking["ai_score"],
            "algorithm": "AI considers distance (×2 weight), price, and availability to find optimal parking"
        },
        "timestamp": datetime.now().strftime("%H:%M:%S")
    })

@app.route('/predict')
def predict_traffic():
    """Predict parking availability based on current time"""
    current_hour = datetime.now().hour
    
    # High traffic prediction between 6 PM (18) to 8 PM (20)
    if 18 <= current_hour <= 20:
        prediction = "High Traffic"
        message = "Peak hours detected. Parking spots fill up quickly!"
        confidence = "85%"
    elif 7 <= current_hour <= 9 or 17 <= current_hour <= 19:
        prediction = "Moderate Traffic"
        message = "Moderate demand expected. Book early for better options."
        confidence = "70%"
    else:
        prediction = "Available"
        message = "Good time to find parking. Multiple options available."
        confidence = "90%"
    
    return jsonify({
        "prediction": prediction,
        "message": message,
        "confidence": confidence,
        "current_time": datetime.now().strftime("%H:%M"),
        "timestamp": datetime.now().strftime("%H:%M:%S")
    })

@app.route('/book', methods=['POST'])
def book_parking():
    """Mock booking endpoint"""
    data = request.get_json()
    parking_id = data.get('parking_id')
    hours = data.get('hours', 1)
    slot_number = data.get('slot_number')
    
    # Find the parking
    parking = next((p for p in parking_data if p["id"] == parking_id), None)
    if not parking:
        return jsonify({"error": "Parking not found"}), 404
    
    if parking["available_slots"] <= 0:
        return jsonify({"error": "No available slots"}), 400
    
    # Generate slot number if not provided
    if not slot_number:
        slot_number = f"A{random.randint(1, 50):02d}"
    
    total_cost = parking["price"] * hours
    booking_id = f"BK{random.randint(1000, 9999)}"
    
    # Create booking record
    booking_time = datetime.now()
    end_time = booking_time + timedelta(hours=hours)
    
    booking_record = {
        "booking_id": booking_id,
        "parking_id": parking_id,
        "parking_name": parking["name"],
        "slot_number": slot_number,
        "hours": hours,
        "total_cost": total_cost,
        "booking_time": booking_time.strftime("%Y-%m-%d %H:%M:%S"),
        "start_time": booking_time.strftime("%H:%M"),
        "end_time": end_time.strftime("%H:%M"),
        "date": booking_time.strftime("%Y-%m-%d"),
        "status": "Active",
        "location": parking["name"],
        "distance": parking["distance"],
        "price_per_hour": parking["price"]
    }
    
    # Add to user bookings
    user_bookings.append(booking_record)
    
    # Reduce available slots
    parking["available_slots"] -= 1
    
    return jsonify({
        "success": True,
        "booking_id": booking_id,
        "parking_name": parking["name"],
        "slot_number": slot_number,
        "hours": hours,
        "total_cost": total_cost,
        "confirmation": f"Your parking spot {slot_number} at {parking['name']} is reserved for {hours} hour(s).",
        "start_time": booking_time.strftime("%H:%M"),
        "end_time": end_time.strftime("%H:%M"),
        "date": booking_time.strftime("%Y-%m-%d")
    })

@app.route('/bookings')
def get_user_bookings():
    """Get user's booking history"""
    # Update booking statuses based on time
    current_time = datetime.now()
    
    for booking in user_bookings:
        booking_datetime = datetime.strptime(booking["booking_time"], "%Y-%m-%d %H:%M:%S")
        end_datetime = booking_datetime + timedelta(hours=booking["hours"])
        
        if current_time > end_datetime:
            booking["status"] = "Completed"
        elif current_time >= booking_datetime:
            booking["status"] = "Active"
        else:
            booking["status"] = "Upcoming"
    
    return jsonify({
        "bookings": user_bookings,
        "total_bookings": len(user_bookings),
        "active_bookings": len([b for b in user_bookings if b["status"] == "Active"]),
        "timestamp": datetime.now().strftime("%H:%M:%S")
    })

@app.route('/slots/<int:parking_id>')
def get_parking_slots(parking_id):
    """Get available slots for a parking location"""
    parking = next((p for p in parking_data if p["id"] == parking_id), None)
    if not parking:
        return jsonify({"error": "Parking not found"}), 404
    
    # Generate mock slot data
    total_slots = parking["total_slots"]
    available_slots = parking["available_slots"]
    
    slots = {}
    # Create slot numbers (A01, A02, B01, etc.)
    slot_count = 0
    for section in ['A', 'B', 'C', 'D']:
        for num in range(1, 26):  # Up to 25 slots per section
            if slot_count >= total_slots:
                break
            slot_number = f"{section}{num:02d}"
            # Randomly assign availability based on available_slots ratio
            is_available = slot_count < available_slots
            slots[slot_number] = is_available
            slot_count += 1
        if slot_count >= total_slots:
            break
    
    return jsonify({
        "parking_id": parking_id,
        "parking_name": parking["name"],
        "total_slots": total_slots,
        "available_slots": available_slots,
        "slots": slots
    })

@app.route('/chat', methods=['POST'])
def chat_with_ai():
    """Simple AI chatbot responses"""
    data = request.get_json()
    message = data.get('message', '').lower()
    
    # Simple keyword-based responses
    if 'cheapest' in message or 'cheap' in message:
        cheapest = min(parking_data, key=lambda x: x['price'])
        response = f"The cheapest parking is {cheapest['name']} at ${cheapest['price']}/hour with {cheapest['available_slots']} slots available."
    elif 'closest' in message or 'near' in message:
        closest = min(parking_data, key=lambda x: x['distance'])
        response = f"The closest parking is {closest['name']} at {closest['distance']} km away with {closest['available_slots']} slots available."
    elif 'available' in message or 'slots' in message:
        most_available = max(parking_data, key=lambda x: x['available_slots'])
        response = f"The parking with most availability is {most_available['name']} with {most_available['available_slots']} slots available."
    elif 'recommend' in message or 'best' in message:
        # Calculate best parking (lowest AI score)
        best = min(parking_data, key=lambda x: calculate_ai_score(x))
        response = f"I recommend {best['name']} - it has the best overall score considering distance, price, and availability. It's {best['distance']} km away, costs ${best['price']}/hour, and has {best['available_slots']} slots available."
    elif 'hello' in message or 'hi' in message:
        response = "Hello! I'm your AI parking assistant. I can help you find the best parking spots based on your needs. What would you like to know?"
    elif 'help' in message:
        response = "I can help you find parking by price, distance, availability, or give you my AI recommendation. Just ask me questions like 'What's the cheapest option?' or 'Where should I park?'"
    else:
        response = "I can help you find parking! Try asking about the cheapest option, closest parking, most available spots, or ask for my recommendation."
    
    return jsonify({"response": response})

if __name__ == '__main__':
    import os
    os.environ['FLASK_ENV'] = 'development'
    print("🚗 Smart Parking AI Agent Starting...")
    print("🌐 Visit: http://localhost:5000")
    app.run(debug=True, port=5000)