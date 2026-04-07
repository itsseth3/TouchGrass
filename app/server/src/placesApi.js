import axios from "axios";

const GOOGLE_BASE = "https://maps.googleapis.com/maps/api/place";
const KEY = process.env.GOOGLE_PLACES_API_KEY;

export async function autocomplete(input, sessiontoken) {
    const url = `${GOOGLE_BASE}/autocomplete/json`;
    const params = {
        input,
        key: KEY,
    };
    if (sessiontoken) params.sessiontoken = sessiontoken;
    const res = await axios.get(url, { params });
    return res.data;
} 

export async function placeDetails(place_id, fields = ['place_id', 'name', 'formatted_address', 'geometry']) {
    const url = `${GOOGLE_BASE}/details/json`;
    const params = {
        place_id,
        key: KEY,
        fields: Array.isArray(fields) ? fields.join(',') : fields
    };
    const res = await axios.get(url, { params });
    return res.data;
}

