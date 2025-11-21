const jwt = require("jsonwebtoken");
require("dotenv").config(); 
const secretKey = process.env.SECRET_KEY
const authenticateWithToken = (req, res, next) => {
    try{
       const token = req.cookies.token;
       console.log("token", token);

       const verify =  jwt.verify(token, secretKey)
       if(!verify){
              res.status(402).send({ "erorr": "unauthorized" })
       }
       next()
    }
    catch(error){
        res.status(500).send({ error:"Internal Server Error" })
    }
}
module.exports = authenticateWithToken