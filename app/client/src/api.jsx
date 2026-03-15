import axios from "axios"

//create resuable instance
const api = axios.create({
    baseURL: "http://localhost:3000/api",
}
    
);

export default api;