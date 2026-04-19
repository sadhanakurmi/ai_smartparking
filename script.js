// Enhanced Smart Parking AI Agent JavaScript
class SmartParkingAI {
    constructor() {
        this.parkingData = [];
        this.filteredData = [];
        this.refreshInterval = null;
        this.currentBooking = null;
        this.selectedSlot = null;
        this.map = null;
        this.markers = [];
        this.infoWindow = null;
        this.chatbotOpen = false;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadInitialData();
        this.startAutoRefresh();
        this.loadPrediction();
        this.loadUserBookings();
        this.initializeChatbot();
    }

    setupEventListeners() {
        // Find Best Parking AI Button
        document.getElementById('findParkingBtn').addEventListener('click', () => {
            this.findBestParking();
        });

        // Advanced Filter controls
        document.getElementById('priceFilter').addEventListener('input', (e) => {
            document.getElementById('priceValue').textContent = e.target.value;
            this.applyFilters();
        });

        document.getElementById('distanceFilter').addEventListener('input', (e) => {
            document.getElementById('distanceValue').textContent = e.target.value;
            this.applyFilters();
        });

        document.getElementById('slotsFilter').addEventListener('input', (e) => {
            document.getElementById('slotsValue').textContent = e.target.value;
            this.applyFilters();
        });

        document.getElementById('sortBy').addEventListener('change', () => {
            this.applyFilters();
        });

        document.getElementById('resetFilters').addEventListener('click', () => {
            this.resetFilters();
        });

        // Modal controls
        document.querySelectorAll('.close').forEach(closeBtn => {
            closeBtn.addEventListener('click', (e) => {
                e.target.closest('.modal').style.display = 'none';
            });
        });

        // Close modal when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                e.target.style.display = 'none';
            }
        });
    }

    async loadInitialData() {
        try {
            await this.loadParkingData();
        } catch (error) {
            console.error('Error loading initial data:', error);
            this.showError('Failed to load parking data');
        }
    }

    async loadParkingData() {
        try {
            const response = await fetch('/parkings');
            const data = await response.json();
            
            this.parkingData = data.parkings;
            this.filteredData = [...this.parkingData];
            this.updateLastUpdateTime(data.timestamp);
            this.renderParkingGrid();
            this.updateMapMarkers();
            
        } catch (error) {
            console.error('Error loading parking data:', error);
            throw error;
        }
    }

    async loadPrediction() {
        try {
            const response = await fetch('/predict');
            const data = await response.json();
            this.renderPrediction(data);
        } catch (error) {
            console.error('Error loading prediction:', error);
        }
    }

    async loadUserBookings() {
        try {
            const response = await fetch('/bookings');
            const data = await response.json();
            this.renderBookings(data);
        } catch (error) {
            console.error('Error loading bookings:', error);
        }
    }

    async findBestParking() {
        const btn = document.getElementById('findParkingBtn');
        const originalText = btn.innerHTML;
        
        // Show loading state with animation
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> AI Analyzing...';
        btn.disabled = true;

        try {
            const response = await fetch('/best-parking');
            const data = await response.json();
            
            this.showAIRecommendation(data);
            this.highlightRecommendedParking(data.best_parking.id);
            this.highlightOnMap(data.best_parking);
            
        } catch (error) {
            console.error('Error getting AI recommendation:', error);
            this.showError('Failed to get AI recommendation');
        } finally {
            // Restore button with delay for better UX
            setTimeout(() => {
                btn.innerHTML = originalText;
                btn.disabled = false;
            }, 1000);
        }
    }

    showAIRecommendation(data) {
        const aiPanel = document.getElementById('aiPanel');
        const aiRecommendation = document.getElementById('aiRecommendation');
        
        const parking = data.best_parking;
        const explanation = data.ai_explanation;
        
        aiRecommendation.innerHTML = `
            <div class="recommended-parking">
                <h4><i class="fas fa-trophy"></i> ${parking.name}</h4>
                <div class="parking-details">
                    <div class="detail-item">
                        <i class="fas fa-route"></i>
                        <span>${parking.distance} km away</span>
                    </div>
                    <div class="detail-item">
                        <i class="fas fa-dollar-sign"></i>
                        <span>$${parking.price}/hour</span>
                    </div>
                    <div class="detail-item">
                        <i class="fas fa-car"></i>
                        <span>${parking.available_slots} slots available</span>
                    </div>
                    <div class="detail-item">
                        <i class="fas fa-star"></i>
                        <span>AI Score: ${parking.ai_score}</span>
                    </div>
                </div>
                <button class="book-btn" onclick="smartParking.openBookingModal(${parking.id})">
                    <i class="fas fa-calendar-check"></i> Book This Spot
                </button>
            </div>
            <div class="ai-explanation">
                <h4><i class="fas fa-brain"></i> AI Reasoning</h4>
                <ul class="ai-reasons">
                    ${explanation.reasons.map(reason => `<li>${reason}</li>`).join('')}
                </ul>
                <p><strong>Algorithm:</strong> ${explanation.algorithm}</p>
                <p><strong>Score:</strong> ${explanation.score} (lower is better)</p>
                <p><strong>Confidence:</strong> ${explanation.confidence}</p>
            </div>
        `;
        
        aiPanel.style.display = 'block';
        aiPanel.scrollIntoView({ behavior: 'smooth' });
    }

    highlightRecommendedParking(parkingId) {
        // Remove previous highlights
        document.querySelectorAll('.parking-card').forEach(card => {
            card.classList.remove('recommended');
        });
        
        // Add highlight to recommended parking
        const recommendedCard = document.querySelector(`[data-parking-id="${parkingId}"]`);
        if (recommendedCard) {
            recommendedCard.classList.add('recommended');
            setTimeout(() => {
                recommendedCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 500);
        }
    }

    renderPrediction(data) {
        const predictionContent = document.getElementById('predictionContent');
        
        let className = 'prediction-available';
        if (data.prediction === 'High Traffic') className = 'prediction-high';
        else if (data.prediction.includes('Rush') || data.prediction === 'Lunch Peak') className = 'prediction-moderate';
        
        predictionContent.innerHTML = `
            <div class="${className}">
                <h4><i class="fas fa-traffic-light"></i> ${data.prediction}</h4>
                <p>${data.message}</p>
                <p><strong>Recommendation:</strong> ${data.recommendation}</p>
                <div style="margin-top: 15px; display: flex; justify-content: space-between; align-items: center;">
                    <small><strong>Confidence:</strong> ${data.confidence}</small>
                    <small><strong>Time:</strong> ${data.current_time}</small>
                </div>
            </div>
        `;
        predictionContent.className = `prediction-content ${className}`;
    }

    renderBookings(data) {
        const bookingsGrid = document.getElementById('bookingsGrid');
        const totalBookingsEl = document.getElementById('totalBookings');
        const activeBookingsEl = document.getElementById('activeBookings');
        
        // Store current bookings for actions
        this.currentBookings = data.bookings;
        
        // Update stats
        totalBookingsEl.textContent = data.total_bookings;
        activeBookingsEl.textContent = data.active_bookings;
        
        if (data.bookings.length === 0) {
            bookingsGrid.innerHTML = `
                <div class="no-bookings">
                    <i class="fas fa-calendar-plus"></i>
                    <p>No bookings yet. Book your first parking spot!</p>
                </div>
            `;
            return;
        }
        
        // Sort bookings by date (newest first)
        const sortedBookings = data.bookings.sort((a, b) => 
            new Date(b.booking_time) - new Date(a.booking_time)
        );
        
        bookingsGrid.innerHTML = sortedBookings.map(booking => {
            const statusClass = booking.status.toLowerCase();
            const isActive = booking.status === 'Active';
            const isUpcoming = booking.status === 'Upcoming';
            
            return `
                <div class="booking-card ${statusClass}">
                    <div class="booking-header">
                        <div class="booking-location">${booking.parking_name}</div>
                        <div class="booking-status ${statusClass}">${booking.status}</div>
                    </div>
                    
                    <div class="booking-time-info">
                        <div class="time-range">${booking.start_time} - ${booking.end_time}</div>
                        <div class="date">${booking.date}</div>
                    </div>
                    
                    <div class="booking-details">
                        <div class="booking-detail-item highlight">
                            <i class="fas fa-parking"></i>
                            <span>Slot ${booking.slot_number}</span>
                        </div>
                        <div class="booking-detail-item">
                            <i class="fas fa-clock"></i>
                            <span>${booking.hours} hour(s)</span>
                        </div>
                        <div class="booking-detail-item">
                            <i class="fas fa-route"></i>
                            <span>${booking.distance} km away</span>
                        </div>
                        <div class="booking-detail-item highlight">
                            <i class="fas fa-dollar-sign"></i>
                            <span>$${booking.total_cost}</span>
                        </div>
                    </div>
                    
                    <div class="booking-actions">
                        ${isActive ? `
                            <button class="booking-btn primary" onclick="smartParking.showDirections('${booking.parking_name}')">
                                <i class="fas fa-directions"></i> Get Directions
                            </button>
                            <button class="booking-btn secondary" onclick="smartParking.extendBooking('${booking.booking_id}')">
                                <i class="fas fa-plus"></i> Extend
                            </button>
                        ` : isUpcoming ? `
                            <button class="booking-btn primary" onclick="smartParking.showBookingDetails('${booking.booking_id}')">
                                <i class="fas fa-info-circle"></i> View Details
                            </button>
                            <button class="booking-btn secondary" onclick="smartParking.cancelBooking('${booking.booking_id}')">
                                <i class="fas fa-times"></i> Cancel
                            </button>
                        ` : `
                            <button class="booking-btn secondary" onclick="smartParking.showBookingDetails('${booking.booking_id}')">
                                <i class="fas fa-receipt"></i> View Receipt
                            </button>
                            <button class="booking-btn secondary" onclick="smartParking.rebookSlot('${booking.parking_id}')">
                                <i class="fas fa-redo"></i> Book Again
                            </button>
                        `}
                    </div>
                    
                    <div class="booking-id" style="text-align: center; margin-top: 10px; font-size: 0.8rem; color: #999;">
                        ID: ${booking.booking_id}
                    </div>
                </div>
            `;
        }).join('');
    }

    renderParkingGrid() {
        const grid = document.getElementById('parkingGrid');
        
        if (this.filteredData.length === 0) {
            grid.innerHTML = `
                <div class="loading-card">
                    <i class="fas fa-search"></i>
                    <p>No parking spots match your filters</p>
                    <button onclick="smartParking.resetFilters()" class="reset-btn" style="margin-top: 15px;">
                        <i class="fas fa-undo"></i> Reset Filters
                    </button>
                </div>
            `;
            return;
        }
        
        grid.innerHTML = this.filteredData.map(parking => {
            const availabilityPercent = (parking.available_slots / parking.total_slots) * 100;
            let availabilityClass = 'availability-high';
            if (availabilityPercent < 30) availabilityClass = 'availability-low';
            else if (availabilityPercent < 60) availabilityClass = 'availability-medium';
            
            const isAvailable = parking.available_slots > 0;
            
            return `
                <div class="parking-card" data-parking-id="${parking.id}">
                    <div class="parking-header">
                        <div class="parking-name">${parking.name}</div>
                        <div class="ai-score">Score: ${parking.ai_score}</div>
                    </div>
                    
                    <div class="parking-details">
                        <div class="detail-item">
                            <i class="fas fa-route"></i>
                            <span>${parking.distance} km</span>
                        </div>
                        <div class="detail-item">
                            <i class="fas fa-dollar-sign"></i>
                            <span>$${parking.price}/hr</span>
                        </div>
                        <div class="detail-item">
                            <i class="fas fa-car"></i>
                            <span>${parking.available_slots}/${parking.total_slots} slots</span>
                        </div>
                        <div class="detail-item">
                            <i class="fas fa-map-marker-alt"></i>
                            <span onclick="smartParking.focusOnMap(${parking.id})" style="cursor: pointer; color: #2196F3;">View on Map</span>
                        </div>
                    </div>
                    
                    <div class="availability">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span>Availability</span>
                            <span>${Math.round(availabilityPercent)}%</span>
                        </div>
                        <div class="availability-bar">
                            <div class="availability-fill ${availabilityClass}" 
                                 style="width: ${availabilityPercent}%"></div>
                        </div>
                    </div>
                    
                    <button class="book-btn" 
                            ${!isAvailable ? 'disabled' : ''} 
                            onclick="smartParking.openBookingModal(${parking.id})">
                        <i class="fas fa-calendar-check"></i>
                        ${isAvailable ? 'Book Now' : 'Fully Booked'}
                    </button>
                </div>
            `;
        }).join('');
    }

    applyFilters() {
        const maxPrice = parseFloat(document.getElementById('priceFilter').value);
        const maxDistance = parseFloat(document.getElementById('distanceFilter').value);
        const minSlots = parseInt(document.getElementById('slotsFilter').value);
        const sortBy = document.getElementById('sortBy').value;
        
        // Apply filters
        this.filteredData = this.parkingData.filter(parking => 
            parking.price <= maxPrice && 
            parking.distance <= maxDistance && 
            parking.available_slots >= minSlots
        );
        
        // Apply sorting
        this.filteredData.sort((a, b) => {
            switch (sortBy) {
                case 'price':
                    return a.price - b.price;
                case 'distance':
                    return a.distance - b.distance;
                case 'availability':
                    return b.available_slots - a.available_slots;
                case 'ai':
                default:
                    return a.ai_score - b.ai_score;
            }
        });
        
        this.renderParkingGrid();
        this.updateMapMarkers();
    }

    resetFilters() {
        document.getElementById('priceFilter').value = 20;
        document.getElementById('distanceFilter').value = 5;
        document.getElementById('slotsFilter').value = 0;
        document.getElementById('sortBy').value = 'ai';
        document.getElementById('priceValue').textContent = '20';
        document.getElementById('distanceValue').textContent = '5';
        document.getElementById('slotsValue').textContent = '0';
        
        this.filteredData = [...this.parkingData];
        this.renderParkingGrid();
        this.updateMapMarkers();
    }

    // Demo Map Integration (works without Google Maps API)
    initMap() {
        console.log('Initializing demo map...');
        
        // Initialize demo map
        if (typeof initDemoMap === 'function') {
            initDemoMap();
        } else {
            // Fallback initialization
            this.createDemoMap();
        }
        
        this.map = 'demo'; // Mark as demo map
        this.createDemoMarkers();
    }
    
    createDemoMap() {
        const mapContainer = document.getElementById('map');
        mapContainer.innerHTML = `
            <div style="position: relative; width: 100%; height: 100%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; overflow: hidden;">
                <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background-image: url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8ZGVmcz4KICAgIDxwYXR0ZXJuIGlkPSJncmlkIiB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiPgogICAgICA8cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMSkiIHN0cm9rZS13aWR0aD0iMSIvPgogICAgPC9wYXR0ZXJuPgogIDwvZGVmcz4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIiAvPgo8L3N2Zz4='); opacity: 0.3;"></div>
                <div style="position: absolute; top: 20px; left: 20px; background: rgba(255,255,255,0.95); padding: 10px 15px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                    <h4 style="margin: 0; color: #2196F3; font-size: 1rem;"><i class="fas fa-map-marked-alt"></i> Manhattan Parking Map</h4>
                </div>
                <div id="demoMarkers" style="position: relative; width: 100%; height: 100%;"></div>
            </div>
        `;
    }

    createDemoMarkers() {
        const markersContainer = document.getElementById('demoMarkers');
        if (!markersContainer) return;
        
        // Clear existing markers
        markersContainer.innerHTML = '';
        
        // Demo positions for parking spots (relative to map container)
        const demoPositions = [
            { id: 1, x: '25%', y: '30%', name: 'Downtown Plaza' },
            { id: 2, x: '60%', y: '45%', name: 'City Mall' },
            { id: 3, x: '40%', y: '25%', name: 'Business Center' },
            { id: 4, x: '75%', y: '70%', name: 'Airport Terminal' },
            { id: 5, x: '20%', y: '60%', name: 'University Campus' },
            { id: 6, x: '55%', y: '75%', name: 'Sports Stadium' }
        ];
        
        // Create markers for filtered data
        this.filteredData.forEach(parking => {
            const position = demoPositions.find(p => p.id === parking.id);
            if (!position) return;
            
            const availabilityPercent = (parking.available_slots / parking.total_slots) * 100;
            let markerColor = '#4CAF50'; // Green for high availability
            let markerSize = '12px';
            
            if (availabilityPercent < 30) {
                markerColor = '#f44336'; // Red for low
                markerSize = '10px';
            } else if (availabilityPercent < 60) {
                markerColor = '#ff9800'; // Orange for medium
                markerSize = '11px';
            }
            
            const marker = document.createElement('div');
            marker.style.cssText = `
                position: absolute;
                left: ${position.x};
                top: ${position.y};
                width: ${markerSize};
                height: ${markerSize};
                background: ${markerColor};
                border: 2px solid white;
                border-radius: 50%;
                cursor: pointer;
                box-shadow: 0 2px 6px rgba(0,0,0,0.3);
                transform: translate(-50%, -50%);
                transition: all 0.3s ease;
                z-index: 10;
            `;
            
            marker.setAttribute('data-parking-id', parking.id);
            marker.title = parking.name;
            
            // Add hover effect
            marker.addEventListener('mouseenter', () => {
                marker.style.transform = 'translate(-50%, -50%) scale(1.3)';
                marker.style.zIndex = '20';
            });
            
            marker.addEventListener('mouseleave', () => {
                marker.style.transform = 'translate(-50%, -50%) scale(1)';
                marker.style.zIndex = '10';
            });
            
            // Add click handler
            marker.addEventListener('click', () => {
                this.showDemoInfoWindow(marker, parking, position);
            });
            
            markersContainer.appendChild(marker);
        });
    }

    updateMapMarkers() {
        // For demo map, use createDemoMarkers
        if (this.map === 'demo') {
            this.createDemoMarkers();
            return;
        }
        
        // Original Google Maps code (if API is available)
        if (!this.map || typeof google === 'undefined') return;
        
        // Clear existing markers
        this.markers.forEach(marker => marker.setMap(null));
        this.markers = [];
        
        // Add Google Maps markers...
    }
    
    showDemoInfoWindow(markerElement, parking, position) {
        // Remove any existing info windows
        const existingInfoWindow = document.querySelector('.demo-info-window');
        if (existingInfoWindow) {
            existingInfoWindow.remove();
        }
        
        const availabilityPercent = Math.round((parking.available_slots / parking.total_slots) * 100);
        let statusColor = '#4CAF50';
        let statusText = 'Good Availability';
        
        if (availabilityPercent < 30) {
            statusColor = '#f44336';
            statusText = 'Limited Availability';
        } else if (availabilityPercent < 60) {
            statusColor = '#ff9800';
            statusText = 'Moderate Availability';
        }
        
        const infoWindow = document.createElement('div');
        infoWindow.className = 'demo-info-window';
        infoWindow.style.cssText = `
            position: absolute;
            left: ${position.x};
            top: ${position.y};
            transform: translate(-50%, -120%);
            background: white;
            border-radius: 12px;
            box-shadow: 0 8px 25px rgba(0,0,0,0.2);
            padding: 15px;
            min-width: 250px;
            z-index: 1000;
            font-family: 'Segoe UI', sans-serif;
            animation: fadeInUp 0.3s ease;
        `;
        
        infoWindow.innerHTML = `
            <div style="position: relative;">
                <button onclick="this.parentElement.parentElement.remove()" style="position: absolute; top: -5px; right: -5px; background: #f44336; color: white; border: none; width: 24px; height: 24px; border-radius: 50%; cursor: pointer; font-size: 12px; display: flex; align-items: center; justify-content: center;">
                    ×
                </button>
                
                <h3 style="margin: 0 0 12px 0; color: #2196F3; font-size: 1.1rem;">${parking.name}</h3>
                
                <div style="display: grid; gap: 8px; margin-bottom: 15px;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <i class="fas fa-dollar-sign" style="color: #4CAF50; width: 16px;"></i>
                        <span><strong>$${parking.price}</strong>/hour</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <i class="fas fa-car" style="color: #2196F3; width: 16px;"></i>
                        <span><strong>${parking.available_slots}</strong> of ${parking.total_slots} slots</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <i class="fas fa-route" style="color: #ff9800; width: 16px;"></i>
                        <span><strong>${parking.distance} km</strong> away</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <i class="fas fa-star" style="color: #FFD700; width: 16px;"></i>
                        <span>AI Score: <strong>${parking.ai_score}</strong></span>
                    </div>
                </div>
                
                <div style="background: ${statusColor}; color: white; padding: 8px 12px; border-radius: 6px; text-align: center; margin-bottom: 12px; font-weight: 600; font-size: 0.9rem;">
                    ${statusText} (${availabilityPercent}%)
                </div>
                
                ${parking.available_slots > 0 ? 
                    `<button onclick="smartParking.openBookingModal(${parking.id}); document.querySelector('.demo-info-window').remove();" 
                            style="width: 100%; background: linear-gradient(45deg, #2196F3, #1976D2); color: white; border: none; padding: 10px 16px; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 0.9rem; transition: all 0.3s ease;">
                        <i class="fas fa-calendar-check"></i> Book This Spot
                    </button>` : 
                    `<button disabled style="width: 100%; background: #ccc; color: #666; border: none; padding: 10px 16px; border-radius: 6px; font-weight: 600; font-size: 0.9rem;">
                        <i class="fas fa-times"></i> Fully Booked
                    </button>`
                }
            </div>
        `;
        
        document.getElementById('demoMarkers').appendChild(infoWindow);
        
        // Auto-close after 10 seconds
        setTimeout(() => {
            if (infoWindow.parentElement) {
                infoWindow.remove();
            }
        }, 10000);
    }

    highlightOnMap(parking) {
        if (this.map === 'demo') {
            // Demo map highlighting
            const marker = document.querySelector(`[data-parking-id="${parking.id}"]`);
            if (marker) {
                // Change marker to gold for recommendation
                marker.style.background = '#FFD700';
                marker.style.borderColor = '#FF8C00';
                marker.style.borderWidth = '3px';
                marker.style.width = '16px';
                marker.style.height = '16px';
                marker.style.boxShadow = '0 4px 12px rgba(255, 215, 0, 0.5)';
                
                // Add pulsing animation
                marker.style.animation = 'pulse 1.5s infinite';
                
                // Show info window after animation
                setTimeout(() => {
                    const demoPositions = [
                        { id: 1, x: '25%', y: '30%' },
                        { id: 2, x: '60%', y: '45%' },
                        { id: 3, x: '40%', y: '25%' },
                        { id: 4, x: '75%', y: '70%' },
                        { id: 5, x: '20%', y: '60%' },
                        { id: 6, x: '55%', y: '75%' }
                    ];
                    const position = demoPositions.find(p => p.id === parking.id);
                    if (position) {
                        this.showDemoInfoWindow(marker, parking, position);
                    }
                }, 1000);
            }
            return;
        }
        
        // Original Google Maps highlighting code
        if (!this.map || typeof google === 'undefined') return;
        // ... Google Maps code ...
    }

    focusOnMap(parkingId) {
        const parking = this.parkingData.find(p => p.id === parkingId);
        if (!parking) return;
        
        if (this.map === 'demo') {
            // Demo map focus
            const marker = document.querySelector(`[data-parking-id="${parkingId}"]`);
            if (marker) {
                // Highlight marker temporarily
                const originalStyle = {
                    background: marker.style.background,
                    transform: marker.style.transform,
                    boxShadow: marker.style.boxShadow
                };
                
                marker.style.background = '#2196F3';
                marker.style.transform = 'translate(-50%, -50%) scale(1.5)';
                marker.style.boxShadow = '0 4px 15px rgba(33, 150, 243, 0.5)';
                marker.style.zIndex = '100';
                
                // Show info window
                const demoPositions = [
                    { id: 1, x: '25%', y: '30%' },
                    { id: 2, x: '60%', y: '45%' },
                    { id: 3, x: '40%', y: '25%' },
                    { id: 4, x: '75%', y: '70%' },
                    { id: 5, x: '20%', y: '60%' },
                    { id: 6, x: '55%', y: '75%' }
                ];
                const position = demoPositions.find(p => p.id === parkingId);
                if (position) {
                    setTimeout(() => {
                        this.showDemoInfoWindow(marker, parking, position);
                    }, 500);
                }
                
                // Restore original style after 3 seconds
                setTimeout(() => {
                    marker.style.background = originalStyle.background;
                    marker.style.transform = originalStyle.transform;
                    marker.style.boxShadow = originalStyle.boxShadow;
                    marker.style.zIndex = '10';
                }, 3000);
            }
            return;
        }
        
        // Fallback: scroll to parking card
        const parkingCard = document.querySelector(`[data-parking-id="${parkingId}"]`);
        if (parkingCard) {
            parkingCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
            parkingCard.style.transform = 'scale(1.02)';
            parkingCard.style.boxShadow = '0 12px 35px rgba(33, 150, 243, 0.3)';
            setTimeout(() => {
                parkingCard.style.transform = '';
                parkingCard.style.boxShadow = '';
            }, 2000);
        }
    }

    // Chatbot functionality
    initializeChatbot() {
        const chatbotBody = document.getElementById('chatbotBody');
        const chatToggle = document.getElementById('chatToggle');
        
        if (chatbotBody && chatToggle) {
            chatbotBody.classList.add('collapsed');
            chatToggle.style.transform = 'rotate(0deg)';
            this.chatbotOpen = false;
            
            console.log('🤖 AI Chatbot initialized and ready!');
        }
    }

    openBookingModal(parkingId) {
        const parking = this.parkingData.find(p => p.id === parkingId);
        if (!parking || parking.available_slots <= 0) {
            this.showError('No available slots at this location.');
            return;
        }
        
        this.currentBooking = parking;
        this.selectedSlot = null;
        
        const modal = document.getElementById('bookingModal');
        const bookingDetails = document.getElementById('bookingDetails');
        
        // Show simple booking form first, then load slots
        bookingDetails.innerHTML = `
            <div class="booking-info">
                <h4>${parking.name}</h4>
                <p><i class="fas fa-route"></i> ${parking.distance} km away</p>
                <p><i class="fas fa-dollar-sign"></i> $${parking.price} per hour</p>
                <p><i class="fas fa-car"></i> ${parking.available_slots} slots available</p>
            </div>
            
            <div class="booking-form">
                <div class="form-group">
                    <label>Select Parking Slot:</label>
                    <div class="slot-selection" id="slotSelection">
                        <div class="loading" style="text-align: center; padding: 20px;">
                            <i class="fas fa-spinner fa-spin"></i> Loading available slots...
                        </div>
                    </div>
                </div>
                
                <div class="form-group">
                    <label>
                        <input type="checkbox" id="autoAssign" checked>
                        Auto-assign best available slot
                    </label>
                </div>
                
                <div class="form-group">
                    <label for="bookingHours">Duration (hours):</label>
                    <select id="bookingHours">
                        <option value="1">1 hour</option>
                        <option value="2">2 hours</option>
                        <option value="3">3 hours</option>
                        <option value="4">4 hours</option>
                        <option value="6">6 hours</option>
                        <option value="8">8 hours</option>
                        <option value="12">12 hours</option>
                        <option value="24">24 hours</option>
                    </select>
                </div>
                
                <div class="cost-display" id="costDisplay">
                    Total Cost: $${parking.price}
                </div>
                
                <button class="confirm-btn" id="confirmBookingBtn">
                    <i class="fas fa-check"></i> Confirm Booking
                </button>
            </div>
        `;
        
        modal.style.display = 'block';
        
        // Add event listeners
        document.getElementById('bookingHours').addEventListener('change', () => this.updateCost());
        document.getElementById('autoAssign').addEventListener('change', () => this.toggleAutoAssign());
        document.getElementById('confirmBookingBtn').addEventListener('click', () => this.confirmBooking());
        
        // Load slot details
        this.loadParkingSlots(parkingId);
    }

    async loadParkingSlots(parkingId) {
        try {
            const response = await fetch(`/slots/${parkingId}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const slotData = await response.json();
            
            // Update the slot selection area
            const slotSelection = document.getElementById('slotSelection');
            if (slotSelection) {
                slotSelection.innerHTML = `
                    <div class="slot-grid">
                        ${this.renderSlotGrid(slotData.slots)}
                    </div>
                    <div class="slot-legend">
                        <div class="legend-item">
                            <span class="slot-indicator available"></span>
                            <span>Available</span>
                        </div>
                        <div class="legend-item">
                            <span class="slot-indicator occupied"></span>
                            <span>Occupied</span>
                        </div>
                        <div class="legend-item">
                            <span class="slot-indicator selected"></span>
                            <span>Selected</span>
                        </div>
                    </div>
                    <div class="selected-slot-info" id="selectedSlotInfo">
                        <p>Click on an available slot to select it, or use auto-assign below.</p>
                    </div>
                `;
            }
            
            return slotData;
        } catch (error) {
            console.error('Error loading slots:', error);
            const slotSelection = document.getElementById('slotSelection');
            if (slotSelection) {
                slotSelection.innerHTML = `
                    <div class="error-message" style="text-align: center; padding: 20px; color: #f44336;">
                        <i class="fas fa-exclamation-triangle"></i>
                        <p>Unable to load slot details. Auto-assign will be used.</p>
                    </div>
                `;
            }
            return { slots: {} };
        }
    }
    
    renderSlotGrid(slots) {
        if (!slots || Object.keys(slots).length === 0) {
            return '<div class="no-slots">No slot information available</div>';
        }
        
        const slotEntries = Object.entries(slots);
        return slotEntries.map(([slotNumber, isAvailable]) => {
            const statusClass = isAvailable ? 'available' : 'occupied';
            return `
                <div class="slot-item ${statusClass}" 
                     data-slot="${slotNumber}" 
                     onclick="smartParking.selectSlot('${slotNumber}', ${isAvailable})">
                    <span class="slot-number">${slotNumber}</span>
                </div>
            `;
        }).join('');
    }
    
    selectSlot(slotNumber, isAvailable) {
        if (!isAvailable) return;
        
        // Remove previous selection
        document.querySelectorAll('.slot-item').forEach(slot => {
            slot.classList.remove('selected');
        });
        
        // Select new slot
        const slotElement = document.querySelector(`[data-slot="${slotNumber}"]`);
        if (slotElement) {
            slotElement.classList.add('selected');
            
            // Update selected slot info
            const selectedSlotInfo = document.getElementById('selectedSlotInfo');
            selectedSlotInfo.innerHTML = `
                <p><strong>Selected Slot:</strong> ${slotNumber}</p>
                <p>This slot will be reserved for your booking.</p>
            `;
            
            // Uncheck auto-assign
            document.getElementById('autoAssign').checked = false;
            
            this.selectedSlot = slotNumber;
        }
    }
    
    toggleAutoAssign() {
        const autoAssign = document.getElementById('autoAssign');
        if (autoAssign.checked) {
            // Clear manual selection
            document.querySelectorAll('.slot-item').forEach(slot => {
                slot.classList.remove('selected');
            });
            
            const selectedSlotInfo = document.getElementById('selectedSlotInfo');
            selectedSlotInfo.innerHTML = `
                <p>Auto-assign is enabled. We'll choose the best available slot for you.</p>
            `;
            
            this.selectedSlot = null;
        }
    }

    updateCost() {
        if (!this.currentBooking) return;
        
        const hours = parseInt(document.getElementById('bookingHours').value);
        const totalCost = this.currentBooking.price * hours;
        
        document.getElementById('costDisplay').innerHTML = `
            Total Cost: $${totalCost}
        `;
    }
    
    async confirmBooking() {
        console.log('Confirm booking called');
        
        if (!this.currentBooking) {
            this.showError('No parking selected for booking.');
            return;
        }
        
        const hoursElement = document.getElementById('bookingHours');
        const autoAssignElement = document.getElementById('autoAssign');
        
        if (!hoursElement) {
            this.showError('Booking form not properly loaded.');
            return;
        }
        
        const hours = parseInt(hoursElement.value) || 1;
        const autoAssign = autoAssignElement ? autoAssignElement.checked : true;
        const selectedSlot = autoAssign ? null : this.selectedSlot;
        
        console.log('Booking details:', {
            parking_id: this.currentBooking.id,
            hours: hours,
            slot_number: selectedSlot,
            auto_assign: autoAssign
        });
        
        if (!autoAssign && !selectedSlot) {
            this.showError('Please select a parking slot or enable auto-assign.');
            return;
        }
        
        // Show loading state
        const confirmBtn = document.getElementById('confirmBookingBtn');
        if (confirmBtn) {
            const originalText = confirmBtn.innerHTML;
            confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Booking...';
            confirmBtn.disabled = true;
            
            try {
                const requestData = {
                    parking_id: this.currentBooking.id,
                    hours: hours
                };
                
                if (selectedSlot) {
                    requestData.slot_number = selectedSlot;
                }
                
                console.log('Sending booking request:', requestData);
                
                const response = await fetch('/book', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(requestData)
                });
                
                console.log('Response status:', response.status);
                
                if (!response.ok) {
                    const errorText = await response.text();
                    console.error('Response error:', errorText);
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const result = await response.json();
                console.log('Booking result:', result);
                
                if (result.success) {
                    // Close booking modal
                    const bookingModal = document.getElementById('bookingModal');
                    if (bookingModal) {
                        bookingModal.style.display = 'none';
                    }
                    
                    // Show success modal
                    this.showSuccessModal(result);
                    
                    // Reset selection
                    this.selectedSlot = null;
                    this.currentBooking = null;
                    
                    // Refresh data
                    await this.loadParkingData();
                    await this.loadUserBookings();
                } else {
                    this.showError('Booking failed: ' + (result.error || 'Unknown error'));
                }
                
            } catch (error) {
                console.error('Booking error:', error);
                this.showError('Booking failed. Please check your connection and try again.');
            } finally {
                // Restore button
                if (confirmBtn) {
                    confirmBtn.innerHTML = originalText;
                    confirmBtn.disabled = false;
                }
            }
        }
    }

    showSuccessModal(bookingData) {
        console.log('Showing success modal with data:', bookingData);
        
        const modal = document.getElementById('successModal');
        const successDetails = document.getElementById('successDetails');
        
        if (!modal || !successDetails) {
            console.error('Success modal elements not found');
            this.showError('Booking successful but unable to show details. Booking ID: ' + bookingData.booking_id);
            return;
        }
        
        successDetails.innerHTML = `
            <div class="booking-confirmation">
                <div style="text-align: center; margin-bottom: 20px;">
                    <i class="fas fa-check-circle" style="font-size: 3rem; color: #4CAF50; margin-bottom: 15px;"></i>
                    <h3 style="color: #4CAF50; margin: 0;">Booking Confirmed!</h3>
                </div>
                
                <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 15px 0;">
                    <p style="margin: 8px 0;"><strong>Booking ID:</strong> <span style="color: #2196F3; font-family: monospace;">${bookingData.booking_id}</span></p>
                    <p style="margin: 8px 0;"><strong>Location:</strong> ${bookingData.parking_name}</p>
                    <p style="margin: 8px 0;"><strong>Slot Number:</strong> <span style="color: #4CAF50; font-weight: bold;">${bookingData.slot_number}</span></p>
                    <p style="margin: 8px 0;"><strong>Duration:</strong> ${bookingData.hours} hour(s)</p>
                    <p style="margin: 8px 0;"><strong>Total Cost:</strong> <span style="color: #f44336; font-weight: bold;">$${bookingData.total_cost}</span></p>
                </div>
                
                <div style="background: #e8f5e8; padding: 15px; border-radius: 8px; border-left: 4px solid #4CAF50;">
                    <p style="margin: 0; color: #2e7d32; font-size: 0.9rem;">
                        <i class="fas fa-info-circle"></i> ${bookingData.confirmation}
                    </p>
                </div>
                
                <div style="text-align: center; margin-top: 20px;">
                    <button onclick="document.getElementById('successModal').style.display='none'" 
                            style="background: #4CAF50; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: 600;">
                        <i class="fas fa-thumbs-up"></i> Got It!
                    </button>
                </div>
            </div>
        `;
        
        modal.style.display = 'block';
        
        // Auto-close after 10 seconds
        setTimeout(() => {
            if (modal.style.display === 'block') {
                modal.style.display = 'none';
            }
        }, 10000);
    }

    updateLastUpdateTime(timestamp) {
        document.getElementById('lastUpdate').textContent = `Updated: ${timestamp}`;
    }

    startAutoRefresh() {
        this.refreshInterval = setInterval(() => {
            if (!document.hidden) {
                this.loadParkingData();
                this.loadPrediction();
                this.loadUserBookings();
            }
        }, 5000);
    }

    // Booking action methods
    showDirections(parkingName) {
        const message = `Getting directions to ${parkingName}...`;
        this.showNotification(message, 'info');
        
        // In a real app, this would integrate with Google Maps or similar
        setTimeout(() => {
            this.showNotification(`Directions to ${parkingName} opened in your maps app!`, 'success');
        }, 1500);
    }
    
    extendBooking(bookingId) {
        const booking = this.findBookingById(bookingId);
        if (!booking) return;
        
        const hours = prompt(`Extend booking for ${booking.parking_name}\nCurrent duration: ${booking.hours} hours\nEnter additional hours:`, '1');
        if (hours && parseInt(hours) > 0) {
            const additionalCost = booking.price_per_hour * parseInt(hours);
            const confirmed = confirm(`Extend booking by ${hours} hour(s)?\nAdditional cost: $${additionalCost}\nTotal new cost: $${booking.total_cost + additionalCost}`);
            
            if (confirmed) {
                // Update booking (in real app, this would be an API call)
                booking.hours += parseInt(hours);
                booking.total_cost += additionalCost;
                
                this.showNotification(`Booking extended by ${hours} hour(s)!`, 'success');
                this.loadUserBookings();
            }
        }
    }
    
    cancelBooking(bookingId) {
        const booking = this.findBookingById(bookingId);
        if (!booking) return;
        
        const confirmed = confirm(`Cancel booking for ${booking.parking_name}?\nSlot: ${booking.slot_number}\nRefund: $${booking.total_cost * 0.8} (20% cancellation fee)`);
        
        if (confirmed) {
            // Remove booking (in real app, this would be an API call)
            const index = user_bookings.findIndex(b => b.booking_id === bookingId);
            if (index > -1) {
                user_bookings.splice(index, 1);
            }
            
            this.showNotification('Booking cancelled successfully!', 'success');
            this.loadUserBookings();
            this.loadParkingData(); // Refresh to show available slot
        }
    }
    
    showBookingDetails(bookingId) {
        const booking = this.findBookingById(bookingId);
        if (!booking) return;
        
        const modal = document.getElementById('successModal');
        const successDetails = document.getElementById('successDetails');
        
        successDetails.innerHTML = `
            <div class="booking-details-modal">
                <div style="text-align: center; margin-bottom: 20px;">
                    <i class="fas fa-receipt" style="font-size: 3rem; color: #2196F3; margin-bottom: 15px;"></i>
                    <h3 style="color: #2196F3; margin: 0;">Booking Details</h3>
                </div>
                
                <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 15px 0;">
                    <p style="margin: 8px 0;"><strong>Booking ID:</strong> <span style="color: #2196F3; font-family: monospace;">${booking.booking_id}</span></p>
                    <p style="margin: 8px 0;"><strong>Location:</strong> ${booking.parking_name}</p>
                    <p style="margin: 8px 0;"><strong>Slot Number:</strong> <span style="color: #4CAF50; font-weight: bold;">${booking.slot_number}</span></p>
                    <p style="margin: 8px 0;"><strong>Date:</strong> ${booking.date}</p>
                    <p style="margin: 8px 0;"><strong>Time:</strong> ${booking.start_time} - ${booking.end_time}</p>
                    <p style="margin: 8px 0;"><strong>Duration:</strong> ${booking.hours} hour(s)</p>
                    <p style="margin: 8px 0;"><strong>Status:</strong> <span style="color: ${booking.status === 'Active' ? '#4CAF50' : booking.status === 'Completed' ? '#9E9E9E' : '#FF9800'}; font-weight: bold;">${booking.status}</span></p>
                    <p style="margin: 8px 0;"><strong>Total Cost:</strong> <span style="color: #f44336; font-weight: bold;">$${booking.total_cost}</span></p>
                </div>
                
                <div style="text-align: center; margin-top: 20px;">
                    <button onclick="document.getElementById('successModal').style.display='none'" 
                            style="background: #2196F3; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: 600;">
                        <i class="fas fa-check"></i> Close
                    </button>
                </div>
            </div>
        `;
        
        modal.style.display = 'block';
    }
    
    rebookSlot(parkingId) {
        this.openBookingModal(parkingId);
        this.showNotification('Rebooking the same location...', 'info');
    }
    
    findBookingById(bookingId) {
        // In a real app, this would fetch from the server
        // For now, we'll simulate finding it in the current data
        return this.currentBookings?.find(b => b.booking_id === bookingId) || null;
    }
    
    showNotification(message, type = 'info') {
        const colors = {
            success: '#4CAF50',
            error: '#f44336',
            info: '#2196F3',
            warning: '#FF9800'
        };
        
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${colors[type]};
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
            z-index: 1001;
            max-width: 300px;
            animation: slideInRight 0.3s ease;
        `;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check' : type === 'error' ? 'exclamation-triangle' : type === 'warning' ? 'exclamation' : 'info-circle'}"></i> ${message}
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideOutRight 0.3s ease';
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 300);
            }
        }, 3000);
    }

    stopAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    }

    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(45deg, #f44336, #d32f2f);
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 15px rgba(244, 67, 54, 0.3);
            z-index: 1001;
            max-width: 300px;
            animation: slideInRight 0.3s ease;
        `;
        errorDiv.innerHTML = `
            <i class="fas fa-exclamation-triangle"></i> ${message}
        `;
        
        document.body.appendChild(errorDiv);
        
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.style.animation = 'slideOutRight 0.3s ease';
                setTimeout(() => {
                    if (errorDiv.parentNode) {
                        errorDiv.parentNode.removeChild(errorDiv);
                    }
                }, 300);
            }
        }, 5000);
    }
}

// Chatbot functions
function toggleChatbot() {
    const chatbotBody = document.getElementById('chatbotBody');
    const chatToggle = document.getElementById('chatToggle');
    
    if (smartParking && smartParking.chatbotOpen) {
        chatbotBody.classList.add('collapsed');
        chatToggle.style.transform = 'rotate(0deg)';
        smartParking.chatbotOpen = false;
    } else {
        chatbotBody.classList.remove('collapsed');
        chatToggle.style.transform = 'rotate(180deg)';
        if (smartParking) smartParking.chatbotOpen = true;
    }
}

function handleChatKeyPress(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        sendChatMessage();
    }
}

async function sendChatMessage() {
    const chatInput = document.getElementById('chatInput');
    const chatSendBtn = document.getElementById('chatSendBtn');
    const message = chatInput.value.trim();
    
    if (!message) return;
    
    const chatMessages = document.getElementById('chatMessages');
    
    // Disable send button
    chatSendBtn.disabled = true;
    chatSendBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    
    // Add user message
    const userMessage = document.createElement('div');
    userMessage.className = 'user-message';
    userMessage.innerHTML = `
        <span>${message}</span>
        <i class="fas fa-user"></i>
    `;
    chatMessages.appendChild(userMessage);
    
    chatInput.value = '';
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    try {
        const response = await fetch('/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message: message })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Add AI response with typing effect
        const aiMessage = document.createElement('div');
        aiMessage.className = 'ai-message';
        aiMessage.innerHTML = `
            <i class="fas fa-robot"></i>
            <span class="typing-text"></span>
        `;
        chatMessages.appendChild(aiMessage);
        
        // Typing effect
        const textSpan = aiMessage.querySelector('.typing-text');
        const text = data.response;
        let i = 0;
        
        function typeWriter() {
            if (i < text.length) {
                textSpan.innerHTML += text.charAt(i);
                i++;
                setTimeout(typeWriter, 30);
            }
        }
        
        typeWriter();
        
    } catch (error) {
        console.error('Chat error:', error);
        const errorMessage = document.createElement('div');
        errorMessage.className = 'ai-message';
        errorMessage.innerHTML = `
            <i class="fas fa-robot"></i>
            <span>Sorry, I'm having trouble right now. Please try again! 🤖</span>
        `;
        chatMessages.appendChild(errorMessage);
    } finally {
        // Re-enable send button
        chatSendBtn.disabled = false;
        chatSendBtn.innerHTML = '<i class="fas fa-paper-plane"></i>';
    }
    
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Demo Map initialization - works immediately without API key
function initMap() {
    console.log('Initializing demo map...');
    if (window.smartParking) {
        smartParking.initMap();
    } else {
        // If smartParking isn't ready yet, wait for it
        setTimeout(() => {
            if (window.smartParking) {
                smartParking.initMap();
            }
        }, 1000);
    }
}

// Initialize the Smart Parking AI when page loads
let smartParking;

document.addEventListener('DOMContentLoaded', () => {
    smartParking = new SmartParkingAI();
    
    console.log('🚗 Enhanced Smart Parking AI Agent Initialized');
    console.log('🤖 AI with dynamic scoring and Google Maps ready!');
    console.log('💬 Chatbot ready for questions!');
});

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
    if (smartParking) {
        if (document.hidden) {
            smartParking.stopAutoRefresh();
        } else {
            smartParking.startAutoRefresh();
        }
    }
});

// Add CSS animations dynamically
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);