// import mongoose from 'mongoose';
// import { DB_NAME } from './constants';
import { app } from './app.js';
import connectDB from './db/index.js';
// require('dotenv').config()
import dotenv from "dotenv"


dotenv.config({
    path: './env'
})

// as in db folder this connectDB is async function so whenever we called that function it will give a promise so we need to handle that promise also so for that we can use ".then" and ".catch"
connectDB()
.then(() => {
    app.listen(process.env.PORT || 8001, () => {
        console.log(`server is running at port: ${process.env.PORT}`)
    })
})
.catch((err) => {
    console.log('MONGO db connectoin failed: ', err)
})



/*
import express from express;
const app = express()

(async () => {
    try{
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        app.on("errror", (error) => {
            console.log("Error: ", error)
            throw error
        })

        app.listen(process.env.PORT, () => {
            console.log(`App is listening on port ${process.env.PORT}`);
        })
    }catch(error){
        console.error('ERROR: ', error);
        throw err
    }
})()

*/