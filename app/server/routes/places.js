import express from "express"
import { autocomplete, placeDetails, textSearch, placePhoto } from "../src/placesApi.js";


const router = express.Router();

// Haversine formula to calculate distance between two lat/lng points in meters
function getDistance(lat1, lng1, lat2, lng2) {
    const R = 6371000; // Earth's radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

router.get('/autocomplete', async (req, res) => {
    try {
        const { input, sessiontoken } = req.query;
        if (!input) return res.status(400).json({ error: 'Input Required.' });
        const data = await autocomplete(input, sessiontoken);
        res.json(data);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Autocompletion failed.' });
    }
});

router.get('/details', async (req, res) => {
    try {
        const { place_id, fields } = req.query;
        if (!place_id) return res.status(400).json({ error: 'Place ID Required.' });
        const data = await placeDetails(place_id, fields);
        res.json(data);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Place details retrieval failed.' });
    }
});

router.get('/search', async (req, res) => {
    try {
        const { lat, lng, radius, tags, minRating, priceLevels, openNow } = req.query;
        if (!lat || !lng || !tags) return res.status(400).json({ error: 'Lat, lng, and tags required.' });
        
        const location = { lat: parseFloat(lat), lng: parseFloat(lng) };
        const radiusNum = parseFloat(radius) || 10000;
        const minRatingNum = minRating ? parseFloat(minRating) : undefined;
        const priceLevelsArr = priceLevels ? priceLevels.split(',').map(p => parseInt(p)) : [];
        const openNowBool = openNow === 'true';
        
        // Use a larger radius for API call to get more results, then filter
        const apiRadius = Math.max(radiusNum, 50000); // at least 50km for API
        const data = await textSearch(tags, location, apiRadius, priceLevelsArr[0], priceLevelsArr[priceLevelsArr.length - 1], openNowBool);
        
        // Filter by minRating if provided
        let results = data.results || [];
        if (minRatingNum !== undefined) {
            results = results.filter(place => place.rating >= minRatingNum);
        }
        
        // Filter by distance
        results = results.filter(place => {
            if (!place.geometry || !place.geometry.location) return false;
            const placeLat = place.geometry.location.lat;
            const placeLng = place.geometry.location.lng;
            const distance = getDistance(location.lat, location.lng, placeLat, placeLng);
            return distance <= radiusNum;
        });
        
        res.json({ results });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Search failed.' });
    }
});

router.get('/photo', async (req, res) => {
    try {
        const { photoReference, maxwidth } = req.query;
        if (!photoReference) return res.status(400).json({ error: 'Photo reference required.' });
        const photoBuffer = await placePhoto(photoReference, maxwidth || 400);
        res.setHeader('Content-Type', 'image/jpeg');
        res.send(photoBuffer);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Photo retrieval failed.' });
    }
});

export default router;
