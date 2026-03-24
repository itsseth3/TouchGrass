export function catchAsyncErrors(fn) {
  return function (req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

export default function handleDBError(res, error){
    //duplicate key
    if(error.code == 11000){
        return res.status(400).json({error: "Email already exists"});
    }
    else if(error.name == "ValidationError"){
        return res.status(400).json({error: error.message});
    }
    else if(error.code == 404){
        return res.status(404).json({error: "User not found or does not exist"});
    }
    else{
        return res.status(500).json({error: error.message});
    }
}