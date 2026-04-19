# 🗺️ Google Maps Setup Guide

## Quick Setup (5 minutes)

### 1. Get Google Maps API Key

1. **Go to Google Cloud Console**: https://console.cloud.google.com/
2. **Create a new project** (or select existing one)
3. **Enable APIs**:
   - Go to "APIs & Services" > "Library"
   - Search for "Maps JavaScript API"
   - Click "Enable"
4. **Create API Key**:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "API Key"
   - Copy your API key

### 2. Add API Key to Your App

1. **Open** `templates/index.html`
2. **Find line 8**:
   ```html
   <script async defer src="https://maps.googleapis.com/maps/api/js?key=YOUR_GOOGLE_MAPS_API_KEY&callback=initMap&libraries=geometry"></script>
   ```
3. **Replace** `YOUR_GOOGLE_MAPS_API_KEY` with your actual API key:
   ```html
   <script async defer src="https://maps.googleapis.com/maps/api/js?key=AIzaSyBvOkBwgGlbUiuS-oKrPrFm9QzXrHq_abc&callback=initMap&libraries=geometry"></script>
   ```

### 3. Run Your App

```bash
python app.py
```

**That's it!** Your interactive map will now show:
- 🟢 Green markers: High availability parking
- 🟠 Orange markers: Medium availability  
- 🔴 Red markers: Low availability
- 🟡 Gold markers: AI recommended spots

## 💡 Important Notes

- **Free Tier**: Google Maps provides $200/month free credit
- **App works without maps**: All features work even without API key
- **Billing required**: You need to enable billing (but won't be charged under free tier)

## 🔒 Security (Optional)

To restrict your API key:
1. Go to Google Cloud Console > Credentials
2. Click on your API key
3. Under "Application restrictions":
   - Select "HTTP referrers"
   - Add: `http://localhost:5000/*`

## 🚨 Troubleshooting

**Map not loading?**
- Check browser console for errors
- Verify API key is correct
- Ensure Maps JavaScript API is enabled
- Check if billing is enabled

**"For development purposes only" watermark?**
- Enable billing in Google Cloud Console
- You won't be charged under the free tier

## 🎯 Features You Get

✅ **Interactive parking map**  
✅ **Click markers for details**  
✅ **AI recommended spots highlighted**  
✅ **Smooth animations**  
✅ **Mobile responsive**  
✅ **Book directly from map**

---

**The app works perfectly without Google Maps too!** 🚗