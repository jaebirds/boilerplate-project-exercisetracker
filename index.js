const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
let bodyParser = require('body-parser');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

mongoose.connect(process.env['MONGO_URI'], { useNewUrlParser: true, useUnifiedTopology: true });

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
});



app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const userSchema = new Schema({
  username: { type: String, required: true }
});
const User = mongoose.model("User", userSchema);

const exerciseSchema = new Schema({
  username: { type: String, required: true },
  description: { type: String, required: true },
  duration: { type: Number, required: true },
  date: { type: String, required: true },
  user_id: { type: String, required: true}
});
const Exercise = mongoose.model("Exercise", exerciseSchema);

app.post("/api/users", (req, res) => {

  let userToSave = new User({username: req.body.username});
  userToSave.save().then((data) => {
    console.log("saved user:", data);
    
    res.json({
      username: data.username,
      _id: data['_id'].toString()
    });
  }).catch((err) => {
    console.error(err);
    res.json({ error: "error saving user" });
  });
});

//let uid = "64344efc41b9459b6ab70392"; //Jaebirds user id

app.post("/api/users/:id/exercises", (req, res) => {

  if (!mongoose.isValidObjectId(req.body[':_id'])) {
    res.json({ error: "error: not a valid id" });
  }

  date = new Date(req.body.date);

  User.findOne({ _id: req.body[':_id'] }).then((user) => {
  
    let exerciseToSave = new Exercise({
      username: user.username,
      description: req.body.description,
      duration: req.body.duration,
      date: date.toDateString(),
      user_id: req.body[':_id']
    });
    exerciseToSave.save().then((data) => {
      console.log("saved exercise:", data);
      res.json({
        _id: req.body[':_id'],
        usename: data.username,
        date: data.date,
        duration: data.duration,
        description: data.description
      });
    }).catch((err) => {
      console.error(err);
      res.json({ error: "error saving exercise" });
    });
  }).catch((err) => {
    console.error(err);
  });
});