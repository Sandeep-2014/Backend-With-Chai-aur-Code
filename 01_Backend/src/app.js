import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'

const app = express()
// we can you cors in different deifferent way we can write this for using cors
// app.use(cors())

// or if we want do some inner settings so we can use this

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

// this is nothing


app.use(express.json({limit: "16kb"}))

app.use(express.urlencoded({extended: true, limit: "16kb"}))

app.use(express.static("public"))

app.use(cookieParser())


// routes import

import userRouter from "./routes/user.routes.js"

// route declaration

app.use("/api/v1/users", userRouter)


export { app }