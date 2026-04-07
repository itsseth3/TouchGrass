import express from "express"
import { autocomplete, placeDetails } from "../src/placesApi.js";


const router = express.Router();

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

export default router;