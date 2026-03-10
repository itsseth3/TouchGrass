export default function Login(){
    return(
        <div>
            <h1>Login</h1>
            <input type="text" placeholder="username/email"/>
            <input type="text" placeholder="password"/>
            <button onClick={() => console.log("CLICKED LOGIN")}>Login</button>
        </div>


    );
}