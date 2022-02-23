const redis = require('redis')

const client = redis.createClient({
    port: process.env.REDIS_PORT,
    host: `${process.env.REDIS_HOST}`
})

client.connect()
 
 client.on('connect', ()=>{
     console.log("Successfully connected to redis database.")
 })

 client.on('ready', ()=>{
     console.log("Client connected to redis database and ready to use...")
 })

 client.on('error',(error)=>{
    console.log(error.message)
 })
 
 client.on('end', ()=>{
     console.log("Client disconnected from redis.")
 })

 process.on('SIGINT', ()=>{
     client.quit()
 })
 
 module.exports = client