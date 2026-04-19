import axios from "axios";

const GOOGLE_BASE = "https://maps.googleapis.com/maps/api/place";
const KEY = process.env.GOOGLE_PLACES_API_KEY;

export async function autocomplete(input, sessiontoken) {
    const url = `${GOOGLE_BASE}/autocomplete/json`;
    const params = {
        input,
        key: KEY,
        types: "(cities)",
        components: "country:us",
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

export async function textSearch(query, location, radius, minPrice, maxPrice, openNow) {
    const url = `${GOOGLE_BASE}/textsearch/json`;
    const params = {
        query,
        key: KEY,
        location: `${location.lat},${location.lng}`,
        radius: radius, //* 1000, // convert to meters
    };
    if (minPrice !== undefined) params.minprice = minPrice;
    if (maxPrice !== undefined) params.maxprice = maxPrice;
    if (openNow) params.opennow = true;
    const res = await axios.get(url, { params });
    return res.data;
}

export async function placePhoto(photoReference, maxwidth = 400) {
    const url = `${GOOGLE_BASE}/photo`;
    const params = {
        photoreference: photoReference,
        key: KEY,
        maxwidth,
    };
    const res = await axios.get(url, { params, responseType: 'arraybuffer' });
    return res.data;
}

