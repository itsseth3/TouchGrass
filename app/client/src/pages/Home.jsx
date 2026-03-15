import {logOut} from "../firebase"
import { Navigate, useNavigate } from "react-router-dom"



export default function Home(){
    const navigate = useNavigate();

    const handleLogOut = async() => {
            await logOut();
            navigate("/");
        };

    return(
        <div>
            <h1>HOME</h1>

            <button type="button" onClick={handleLogOut}>LOG OUT</button>
        </div>
    );
}