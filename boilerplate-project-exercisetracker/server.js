const express = require('express')
const app = express()
const cors = require('cors')
const bodyParser = require("body-parser");
const { nanoid } = require('nanoid')
const nano = nanoid();
const structuredClone = require("structured-clone")
require('dotenv').config()
var mongoose = require('mongoose')
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true });

app.use(cors())
app.use("/", bodyParser.urlencoded({extended: false}))
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

const database = []

const { Schema } = mongoose

const userSchema = new Schema({
  _id: String,
  username: String,
  from: String,
  to: String,
  count: Number,
  log: [
    {
    description: String,
    duration: Number,
    date: String
    }
  ]
})

let User = mongoose.model("User", userSchema)

app.post("/api/users", (req, res) => {
  const username = req.body.username;
  const id = nanoid();
  
  const newUser = new User({_id: id, username: username, count: 0})
  newUser.save((err, user) => {
    if(err){
      console.log(err)
    }
    else{
      res.json({username: user.username, _id: user._id})
    }
  })
})

app.get("/api/users", (req, res) => {
  User.find((err, users) => {
    if(err){
      console.log(err)
    }
    else{
      res.send(users)
    }
  })
})

app.post("/api/users/:_id/exercises", (req, res) => {
  const id = req.params._id;
  const description = req.body.description;
  const duration = req.body.duration * 1;
  const count = 0;
  var date = new Date(req.body.date);
  if(date == "Invalid Date" || date == "" || date == null || date == undefined){
    date = new Date;
  }

  const exercise = {
    description: description,
    duration: duration,
    date: date.toDateString()
  }

  User.findOneAndUpdate({_id: id}, {$push: {log: exercise}, $inc: {count: 1}}, {new: true}, (err, user) => {
    if(err){
      console.log(err)
    }
    else{
      res.json({_id: user.id, username: user.username, date: exercise.date, duration: exercise.duration, description: exercise.description})
    }
  })
})

app.get("/api/users/:_id/logs", (req, res) => {
  const id = req.params._id;
  const from = new Date(req.query.from);
  const to = new Date(req.query.to);
  const limit = req.query.limit;
  console.log(limit)
 if(from != "Invalid Date" || to != "Invalid Date"){
   User.findOne({_id: id}, (err, user) => {
     if(err){
       console.log(err)
     }
     else{
       if(limit != undefined){
        user.count = limit;
       }  
       if(from != "Invalid Date" && to != "Invalid Date"){
         user.from = from;
         user.to = to;
         res.json({_id: user._id, username: user.username, from: from, to: to, count: user.count, log: user.log.slice(0, user.count)})
       }
       else if(from != "Invalid Date"){
         user.from = from;
         res.json({_id: user._id, username: user.username, from: from, count: user.count, log: user.log.slice(0, user.count)})
       }
       else if(to != "Invalid Date"){
         user.to = to;
         res.json({_id: user._id, username: user.username, to: to, count: user.count, log: user.log.slice(0, user.count)})
       }
       
     }
   })
  }
  else {
    User.findOne({_id: id}, (err, user) => {
      if(err){
        console.log(err)
      }
      else{
        if(limit != undefined){
        user.count = limit;
        }  
        res.json({_id: user._id, username: user.username, count: user.count, log: user.log.slice(0, user.count)})
      }
    })
  } 
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
