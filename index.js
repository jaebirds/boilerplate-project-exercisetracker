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
  description: String,
  duration: Number,
  date: String
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
  });
});