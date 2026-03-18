export default function handleDBError(res, error){
    //duplicate key
    if(error.code == 11000){
        return res.status(400).json({error: "Email already exists"});
    }
    else if(error.name == "ValidationError"){
        return res.status(400).json({error: error.message});
    }
    else{
        return res.status(500).json({error: error.message});
    }
}