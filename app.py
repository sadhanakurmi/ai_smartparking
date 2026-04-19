from flask import Flask, jsonify, render_template, request
import random
import json
from datetime import datetime

app = Flask(__name__)

# Enhanced parking data with slot details
parking_data = [
    {
        "id": 1, "name": "Downtown Plaza", "distance": 0.5, "price": 8, 
        "available_slots": 15, "total_slots": 20, "lat": 40.7589, "lng": -73.9851,
        "slots": {"A1": True, "A2": True, "A3": False, "A4": True, "A5": False, "B1": True, "B2": True, "B3": True, "B4": False, "B5": True, "C1": True, "C2": False, "C3": True, "C4": True, "C5": True, "D1": False, "D2": True, "D3": True, "D4": False, "D5": True}
    },
    {
        "id": 2, "name": "City Mall", "distance": 1.2, "price": 5, 
        "available_slots": 8, "total_slots": 25, "lat": 40.7505, "lng": -73.9934,
        "slots": {"L1-01": True, "L1-02": False, "L1-03": True, "L1-04": False, "L1-05": True, "L1-06": False, "L1-07": True, "L1-08": False, "L1-09": False, "L1-10": True, "L2-01": False, "L2-02": False, "L2-03": True, "L2-04": False, "L2-05": False, "L2-06": True, "L2-07": False, "L2-08": False, "L2-09": False, "L2-10": False, "L3-01": True, "L3-02": False, "L3-03": False, "L3-04": False, "L3-05": True}
    },
    {
        "id": 3, "name": "Business Center", "distance": 0.8, "price": 12, 
        "available_slots": 3, "total_slots": 15, "lat": 40.7614, "lng": -73.9776,
        "slots": {"P01": False, "P02": True, "P03": False, "P04": False, "P05": True, "P06": False, "P07": False, "P08": False, "P09": False, "P10": False, "P11": False, "P12": False, "P13": True, "P14": False, "P15": False}
    },
    {
        "id": 4, "name": "Airport Terminal", "distance": 3.5, "price": 15, 
        "available_slots": 22, "total_slots": 50, "lat": 40.6892, "lng": -74.1745,
        "slots": {f"T{i:02d}": i % 3 != 0 for i in range(1, 51)}
    },
    {
        "id": 5, "name": "University Campus", "distance": 2.1, "price": 3, 
        "available_slots": 12, "total_slots": 30, "lat": 40.8075, "lng": -73.9626,
        "slots": {f"U-{chr(65 + i//10)}{(i%10)+1:02d}": i % 5 != 0 for i in range(30)}
    },
    {
        "id": 6, "name": "Sports Stadium", "distance": 1.8, "price": 6, 
        "available_slots": 18, "total_slots": 40, "lat": 40.8296, "lng": -73.9262,
        "slots": {f"S{i:03d}": i % 4 != 0 for i in range(1, 41)}
    }
]

def update_parking_slots():
    """Randomly update available slots to simulate real-time changes"""
    for parking in parking_data:
        # Randomly change some slot statuses
        available_slots = list(parking["slots"].keys())
        
        # Randomly free up 1-2 occupied slots
        occupied_slots = [slot for slot, available in parking["slots"].items() if not available]
        if occupied_slots and random.random() < 0.3:
            slot_to_free = random.choice(occupied_slots)
            parking["slots"][slot_to_free] = True
        
        # Randomly occupy 1-2 available slots
        free_slots = [slot for slot, available in parking["slots"].items() if available]
        if free_slots and random.random() < 0.4:
            slot_to_occupy = random.choice(free_slots)
            parking["slots"][slot_to_occupy] = False
        
        # Update available_slots count
        parking["available_slots"] = sum(1 for available in parking["slots"].values() if available)

def calculate_ai_score(parking):
    """
    ENHANCED AI SCORING ALGORITHM with dynamic weights
    Lower score = Better parking option
    """
    current_hour = datetime.now().hour
    
    # Dynamic weights based on time (peak hours prioritize availability)
    if 7 <= current_hour <= 9 or 17 <= current_hour <= 19:  # Peak hours
        distance_weight = 1.5
        price_weight = 1.0
        availability_weight = 2.0
    elif 18 <= current_hour <= 20:  # High traffic hours
        distance_weight = 1.0
        price_weight = 0.8
        availability_weight = 3.0
    else:  # Normal hours
        distance_weight = 2.0
        price_weight = 1.2
        availability_weight = 1.0
    
    # Calculate weighted score
    distance_score = parking["distance"] * distance_weight
    price_score = parking["price"] * price_weight
    availability_score = parking["available_slots"] * availability_weight
    
    score = distance_score + price_score - availability_score
    return round(score, 2)

def get_ai_reasoning(best_parking, all_parkings):
    """Generate detailed AI reasoning for parking selection"""
    current_hour = datetime.now().hour
    reasons = []
    
    # Time-based reasoning
    if 7 <= current_hour <= 9 or 17 <= current_hour <= 19:
        reasons.append("Peak hours detected - prioritizing availability and reasonable distance")
    elif 18 <= current_hour <= 20:
        reasons.append("High traffic period - focusing on spots with high availability")
    else:
        reasons.append("Normal traffic - balancing distance, price, and availability")
    
    # Specific advantages
    closest_distance = min(p["distance"] for p in all_parkings)
    cheapest_price = min(p["price"] for p in all_parkings)
    highest_availability = max(p["available_slots"] for p in all_parkings)
    
    if best_parking["distance"] == closest_distance:
        reasons.append("Closest location to your destination")
    elif best_parking["distance"] <= 1.0:
        reasons.append("Very close to destination (under 1km)")
    
    if best_parking["price"] == cheapest_price:
        reasons.append("Most affordable parking option")
    elif best_parking["price"] <= 6:
        reasons.append("Budget-friendly pricing")
    
    if best_parking["available_slots"] >= 15:
        reasons.append("Excellent availability - low risk of being full")
    elif best_parking["available_slots"] >= 8:
        reasons.append("Good availability with multiple spots")
    elif best_parking["available_slots"] >= 3:
        reasons.append("Limited but available spots")
    
    return reasons

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/parkings')
def get_parkings():
    """Return all parking data with AI scores"""
    update_parking_slots()
    
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
    """Enhanced AI recommendation with detailed reasoning"""
    update_parking_slots()
    
    scored_parkings = []
    for parking in parking_data:
        parking_with_score = parking.copy()
        parking_with_score["ai_score"] = calculate_ai_score(parking)
        scored_parkings.append(parking_with_score)
    
    # Find best parking (lowest score)
    best_parking = min(scored_parkings, key=lambda x: x["ai_score"])
    
    # Generate detailed AI reasoning
    reasons = get_ai_reasoning(best_parking, parking_data)
    
    current_hour = datetime.now().hour
    algorithm_explanation = f"AI uses dynamic weights: Distance×{2.0 if 12 <= current_hour <= 16 else 1.5}, Price×1.0, Availability×{3.0 if 18 <= current_hour <= 20 else 1.0}"
    
    return jsonify({
        "best_parking": best_parking,
        "ai_explanation": {
            "reasons": reasons,
            "score": best_parking["ai_score"],
            "algorithm": algorithm_explanation,
            "confidence": "94%" if best_parking["available_slots"] > 10 else "87%"
        },
        "timestamp": datetime.now().strftime("%H:%M:%S")
    })

@app.route('/predict')
def predict_traffic():
    """Enhanced traffic prediction with more detailed analysis"""
    current_hour = datetime.now().hour
    
    if 18 <= current_hour <= 20:
        prediction = "High Traffic"
        message = "Peak evening hours! Parking fills up fast. Book immediately for guaranteed spots."
        confidence = "92%"
        recommendation = "Consider booking now or look for spots with high availability"
    elif 7 <= current_hour <= 9:
        prediction = "Morning Rush"
        message = "Morning commute traffic. Business areas are getting busy."
        confidence = "88%"
        recommendation = "Downtown and business centers filling up quickly"
    elif 17 <= current_hour <= 19:
        prediction = "Evening Rush"
        message = "Evening commute starting. Popular areas becoming crowded."
        confidence = "85%"
        recommendation = "Book early for prime locations"
    elif 12 <= current_hour <= 14:
        prediction = "Lunch Peak"
        message = "Lunch hour traffic. City center spots in demand."
        confidence = "75%"
        recommendation = "Good availability at most locations"
    else:
        prediction = "Available"
        message = "Optimal time for parking! Multiple options with good availability."
        confidence = "95%"
        recommendation = "Great time to find your preferred spot"
    
    return jsonify({
        "prediction": prediction,
        "message": message,
        "confidence": confidence,
        "recommendation": recommendation,
        "current_time": datetime.now().strftime("%H:%M"),
        "timestamp": datetime.now().strftime("%H:%M:%S")
    })

@app.route('/slots/<int:parking_id>')
def get_parking_slots(parking_id):
    """Get individual slot details for a parking location"""
    parking = next((p for p in parking_data if p["id"] == parking_id), None)
    if not parking:
        return jsonify({"error": "Parking not found"}), 404
    
    return jsonify({
        "parking_id": parking_id,
        "parking_name": parking["name"],
        "slots": parking["slots"],
        "available_count": parking["available_slots"],
        "total_count": parking["total_slots"],
        "price_per_hour": parking["price"],
        "timestamp": datetime.now().strftime("%H:%M:%S")
    })

@app.route('/book', methods=['POST'])
def book_parking():
    """Enhanced booking with slot selection"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400
            
        parking_id = data.get('parking_id')
        hours = data.get('hours', 1)
        selected_slot = data.get('slot_number')
        
        print(f"Booking request: parking_id={parking_id}, hours={hours}, slot={selected_slot}")
        
        if not parking_id:
            return jsonify({"error": "Parking ID is required"}), 400
        
        parking = next((p for p in parking_data if p["id"] == parking_id), None)
        if not parking:
            return jsonify({"error": "Parking location not found"}), 404
        
        if parking["available_slots"] <= 0:
            return jsonify({"error": "No available slots at this location"}), 400
        
        # If specific slot selected, check if it's available
        if selected_slot:
            if selected_slot not in parking["slots"]:
                return jsonify({"error": f"Slot {selected_slot} does not exist"}), 400
            if not parking["slots"][selected_slot]:
                return jsonify({"error": f"Slot {selected_slot} is already occupied"}), 400
            
            # Book the specific slot
            parking["slots"][selected_slot] = False
            booked_slot = selected_slot
            print(f"Booked specific slot: {booked_slot}")
        else:
            # Auto-assign first available slot
            available_slots = [slot for slot, available in parking["slots"].items() if available]
            if not available_slots:
                return jsonify({"error": "No available slots found"}), 400
            
            booked_slot = available_slots[0]
            parking["slots"][booked_slot] = False
            print(f"Auto-assigned slot: {booked_slot}")
        
        # Update available count
        parking["available_slots"] = sum(1 for available in parking["slots"].values() if available)
        
        total_cost = parking["price"] * hours
        booking_id = f"SP{random.randint(10000, 99999)}"
        
        result = {
            "success": True,
            "booking_id": booking_id,
            "parking_name": parking["name"],
            "slot_number": booked_slot,
            "hours": hours,
            "total_cost": total_cost,
            "location": {"lat": parking["lat"], "lng": parking["lng"]},
            "message": f"Successfully booked slot {booked_slot} at {parking['name']} for {hours} hour(s) - Total: ${total_cost}",
            "confirmation": f"Your parking slot {booked_slot} is reserved! Booking ID: {booking_id}"
        }
        
        print(f"Booking successful: {result}")
        return jsonify(result)
        
    except Exception as e:
        print(f"Booking error: {str(e)}")
        return jsonify({
            "error": f"Internal server error: {str(e)}"
        }), 500
def chat_with_ai():
    """Enhanced AI chatbot for parking queries"""
    try:
        data = request.get_json()
        if not data or 'message' not in data:
            return jsonify({"error": "No message provided"}), 400
            
        user_message = data.get('message', '').lower().strip()
        
        if not user_message:
            return jsonify({"error": "Empty message"}), 400
        
        # Update parking data for real-time responses
        update_parking_slots()
        
        # Enhanced keyword-based responses
        if any(word in user_message for word in ['where', 'park', 'should', 'recommend']):
            # Get best parking recommendation
            scored_parkings = [
                {**parking, "ai_score": calculate_ai_score(parking)} 
                for parking in parking_data
            ]
            best = min(scored_parkings, key=lambda x: x["ai_score"])
            
            response = f"🤖 I recommend **{best['name']}**! Here's why:\n\n"
            response += f"📍 Only {best['distance']}km away\n"
            response += f"💰 ${best['price']}/hour (great value)\n"
            response += f"🚗 {best['available_slots']} spots available\n"
            response += f"⭐ AI Score: {best['ai_score']} (lower is better)\n\n"
            response += f"This is the optimal choice based on distance, price, and availability!"
        
        elif any(word in user_message for word in ['cheap', 'affordable', 'budget', 'price']):
            cheapest = min(parking_data, key=lambda x: x['price'])
            response = f"🤖 The most affordable option is **{cheapest['name']}**!\n\n"
            response += f"💰 Only ${cheapest['price']}/hour\n"
            response += f"📍 {cheapest['distance']}km away\n"
            response += f"🚗 {cheapest['available_slots']} spots available\n\n"
            response += f"Perfect for budget-conscious parking! 💸"
        
        elif any(word in user_message for word in ['close', 'near', 'closest', 'distance']):
            closest = min(parking_data, key=lambda x: x['distance'])
            response = f"🤖 The closest parking is **{closest['name']}**!\n\n"
            response += f"📍 Just {closest['distance']}km away\n"
            response += f"💰 ${closest['price']}/hour\n"
            response += f"🚗 {closest['available_slots']} spots available\n\n"
            response += f"You'll be there in no time! 🚗💨"
        
        elif any(word in user_message for word in ['available', 'slots', 'space', 'room']):
            most_available = max(parking_data, key=lambda x: x['available_slots'])
            response = f"🤖 **{most_available['name']}** has the most availability!\n\n"
            response += f"🚗 {most_available['available_slots']} out of {most_available['total_slots']} spots free\n"
            response += f"📍 {most_available['distance']}km away\n"
            response += f"💰 ${most_available['price']}/hour\n\n"
            response += f"Plenty of space - no worries about finding a spot! 🎯"
        
        elif any(word in user_message for word in ['map', 'location', 'show', 'see']):
            response = f"🤖 Check out the interactive map above! 🗺️\n\n"
            response += f"🟢 Green markers = High availability\n"
            response += f"🟠 Orange markers = Medium availability\n"
            response += f"🔴 Red markers = Limited availability\n"
            response += f"🟡 Gold markers = AI recommended\n\n"
            response += f"Click any marker for details and instant booking!"
        
        elif any(word in user_message for word in ['book', 'reserve', 'how']):
            response = f"🤖 Booking is super easy! Here's how:\n\n"
            response += f"1️⃣ Click 'Find Best Parking (AI)' for recommendations\n"
            response += f"2️⃣ Or click 'Book Now' on any parking card\n"
            response += f"3️⃣ Or click map markers for instant booking\n"
            response += f"4️⃣ Choose your duration (1-24 hours)\n"
            response += f"5️⃣ Confirm and get your booking ID!\n\n"
            response += f"It takes less than 30 seconds! ⚡"
        
        elif any(word in user_message for word in ['traffic', 'busy', 'peak', 'time']):
            # Get current prediction
            current_hour = datetime.now().hour
            if 18 <= current_hour <= 20:
                response = f"🤖 It's peak traffic time right now! 🚦\n\n"
                response += f"⚠️ Parking fills up quickly during 6-8 PM\n"
                response += f"💡 I recommend booking immediately\n"
                response += f"🎯 Look for spots with high availability\n\n"
                response += f"Don't wait - secure your spot now!"
            else:
                response = f"🤖 Good timing! Traffic is manageable right now. 👍\n\n"
                response += f"✅ Multiple parking options available\n"
                response += f"💰 You can be selective about price\n"
                response += f"📍 Distance shouldn't be a major concern\n\n"
                response += f"Perfect time to find your ideal spot!"
        
        elif any(word in user_message for word in ['help', 'what', 'can', 'do']):
            response = f"🤖 I'm your AI parking assistant! I can help you:\n\n"
            response += f"🎯 Find the best parking spot\n"
            response += f"💰 Locate cheapest options\n"
            response += f"📍 Find closest parking\n"
            response += f"🚗 Check availability\n"
            response += f"🗺️ Explain the map\n"
            response += f"📱 Guide you through booking\n"
            response += f"🚦 Provide traffic insights\n\n"
            response += f"Just ask me anything about parking!"
        
        elif any(word in user_message for word in ['hi', 'hello', 'hey']):
            response = f"🤖 Hello! I'm your smart parking assistant! 👋\n\n"
            response += f"I can help you find the perfect parking spot based on:\n"
            response += f"• Distance to your destination\n"
            response += f"• Price preferences\n"
            response += f"• Real-time availability\n"
            response += f"• AI recommendations\n\n"
            response += f"Try asking: 'Where should I park?' 🚗"
        
        else:
            response = f"🤖 I'd love to help you with parking! Try asking:\n\n"
            response += f"💡 'Where should I park?'\n"
            response += f"💰 'What's the cheapest option?'\n"
            response += f"📍 'What's closest to me?'\n"
            response += f"🚗 'What has the most availability?'\n"
            response += f"🗺️ 'Show me the map'\n"
            response += f"📱 'How do I book?'\n\n"
            response += f"I'm here to make parking easy for you! 🎯"
        
        return jsonify({
            "response": response,
            "timestamp": datetime.now().strftime("%H:%M:%S")
        })
        
    except Exception as e:
        print(f"Chat error: {e}")
        return jsonify({
            "response": "🤖 Oops! I'm having a technical hiccup. Please try asking again! 🔧",
            "timestamp": datetime.now().strftime("%H:%M:%S")
        }), 500

@app.route('/chat', methods=['POST'])
def chat_with_ai():
    """Enhanced AI chatbot for parking queries"""
    try:
        data = request.get_json()
        if not data or 'message' not in data:
            return jsonify({"error": "No message provided"}), 400
            
        user_message = data.get('message', '').lower().strip()
        
        if not user_message:
            return jsonify({"error": "Empty message"}), 400
        
        # Update parking data for real-time responses
        update_parking_slots()
        
        # Enhanced keyword-based responses
        if any(word in user_message for word in ['where', 'park', 'should', 'recommend']):
            # Get best parking recommendation
            scored_parkings = [
                {**parking, "ai_score": calculate_ai_score(parking)} 
                for parking in parking_data
            ]
            best = min(scored_parkings, key=lambda x: x["ai_score"])
            
            response = f"🤖 I recommend **{best['name']}**! Here's why:\n\n"
            response += f"📍 Only {best['distance']}km away\n"
            response += f"💰 ${best['price']}/hour (great value)\n"
            response += f"🚗 {best['available_slots']} spots available\n"
            response += f"⭐ AI Score: {best['ai_score']} (lower is better)\n\n"
            response += f"This is the optimal choice based on distance, price, and availability!"
        
        elif any(word in user_message for word in ['cheap', 'affordable', 'budget', 'price']):
            cheapest = min(parking_data, key=lambda x: x['price'])
            response = f"🤖 The most affordable option is **{cheapest['name']}**!\n\n"
            response += f"💰 Only ${cheapest['price']}/hour\n"
            response += f"📍 {cheapest['distance']}km away\n"
            response += f"🚗 {cheapest['available_slots']} spots available\n\n"
            response += f"Perfect for budget-conscious parking! 💸"
        
        else:
            response = f"🤖 I'd love to help you with parking! Try asking:\n\n"
            response += f"💡 'Where should I park?'\n"
            response += f"💰 'What's the cheapest option?'\n"
            response += f"📍 'What's closest to me?'\n"
            response += f"🚗 'What has the most availability?'\n\n"
            response += f"I'm here to make parking easy for you! 🎯"
        
        return jsonify({
            "response": response,
            "timestamp": datetime.now().strftime("%H:%M:%S")
        })
        
    except Exception as e:
        print(f"Chat error: {e}")
        return jsonify({
            "response": "🤖 Oops! I'm having a technical hiccup. Please try asking again! 🔧",
            "timestamp": datetime.now().strftime("%H:%M:%S")
        }), 500

if __name__ == '__main__':
    print("🚗 Enhanced Smart Parking AI Agent Starting...")
    print("🤖 AI-powered recommendations with dynamic scoring")
    print("🗺️  Google Maps integration ready")
    print("🌐 Visit: http://localhost:5000")
    app.run(debug=True, port=5000)