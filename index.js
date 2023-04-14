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
    
    return res.json({
      username: data.username,
      _id: data['_id'].toString()
    });
  }).catch((err) => {
    console.error(err);
    return res.json({ error: "error saving user" });
  });
});

app.post("/api/users/:id/exercises", (req, res) => {

  if (!mongoose.isValidObjectId(req.params.id)) {
    console.log("error adding exercise, not a valid id: ", req.params.id);
    return res.json({ error: "error: not a valid id" });
  }

  let date;
  if (req.body.date) {
    date = new Date(req.body.date);
    // date off by 1, doesn't need this when running on replit
    let days = date.getDate();
    date.setDate(days + 1);
  } else
    date = new Date();

  User.findOne({ _id: req.params.id }).then((user) => {

    if (user != null) {
  
      let exerciseToSave = new Exercise({
        username: user.username,
        description: req.body.description,
        duration: req.body.duration,
        date: date.toDateString(),
        user_id: req.params.id
      });
      exerciseToSave.save().then((data) => {
        console.log("saved exercise:", data);

        user.date = data.date;
        user.duration = data.duration;
        user.description = data.description;
        
        return res.json({
          _id: req.params.id,
          username: data.username,
          date: data.date,
          duration: data.duration,
          description: data.description
        });
      }).catch((err) => {
        console.error(err);
        return res.json({ error: "error saving exercise" });
      });
    } else {
      console.log("error saving exercise, can't find user: ", req.body[':_id']);
      return res.json({ error: "can't find user" });
    }
  }).catch((err) => {
    console.error(err);
  });
});

function filterDates(arr, dateFrom, dateTo) {

  let arr2 = [];
  let dateToTest;
  if (dateFrom == "" && dateTo == "")
    arr2 = arr;
  else if (dateFrom != "" && dateTo == "") {
    dateFrom = new Date(dateFrom);
    for (let i = 0; i < arr.length; i++) {
      dateToTest = new Date(arr[i].date);
      dateToTest.setUTCHours(0,0,0,0);
      if (dateToTest >= dateFrom)
        arr2.push(arr[i]);
    }
  } else if (dateFrom == "" && dateTo != "") {
    dateTo = new Date(dateTo);
    for (let i = 0; i < arr.length; i++) {
      dateToTest = new Date(arr[i].date);
      dateToTest.setUTCHours(0,0,0,0);
      if (dateToTest <= dateTo)
        arr2.push(arr[i]);
    }
  } else {
    dateTo = new Date(dateTo);
    dateFrom = new Date(dateFrom);
    for (let i = 0; i < arr.length; i++) {
      dateToTest = new Date(arr[i].date);
      dateToTest.setUTCHours(0,0,0,0);
      if (dateToTest >= dateFrom && dateToTest <= dateTo)
        arr2.push(arr[i]);
    }
  }

  return arr2;
}

// GET /api/users/:_id/logs?[from][&to][&limit]
app.get("/api/users/:_id/logs", (req, res) => {

  User.findOne({ _id: req.params['_id'] }).then((user) => {

    let limit = 0;
    if (req.query.limit != undefined)
      limit = req.query.limit;

    let dateFrom = "";
    if (req.query.from != undefined)
      dateFrom = req.query.from;

    let dateTo =  "";
    if (req.query.to != undefined)
      dateTo = req.query.to;

    console.log("retrieving log, id = " + req.params['_id'] + ", limit = " + limit + ", dateFrom = " + dateFrom + ", dateTo = " + dateTo);
  
    Exercise.find({ username: user.username }).then((arr) => {

      let filteredArray = filterDates(arr, dateFrom, dateTo);
      let logArr = [];

      for (let i = 0; i < filteredArray.length; i++) {
        let obj = {
          description: filteredArray[i].description,
          duration: filteredArray[i].duration,
          date: filteredArray[i].date
        }
        logArr.push(obj)
      }

      if (limit > 0)
        logArr = logArr.slice(0, limit);

      console.log("log returning: ", {
        _id: user['_id'],
        username: user.username,
        count: logArr.length,
        log: logArr
      });
      return res.json({
        _id: user['_id'],
        username: user.username,
        count: logArr.length,
        log: logArr
      });
  
    }).catch((err) => {
      console.error(err);
    });
  
  }).catch((err) => {
    console.error(err);
  });
});

app.get("/api/users", (req, res) => {

  User.find({}).then((users) => {

    let toRes = [];
    for (let i = 0; i < users.length; i++) {
      toRes.push({
        username: users[i].username,
        _id: users[i]['_id']
      });
    }

    return res.json(toRes);

  }).catch((err) => {
    console.error(err);
  });
});