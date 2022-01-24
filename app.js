//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require('mongoose');

const app = express();

let loggedIn = false;
let taskList = [];
let noteList = [];
let emailLoggedIn = "";

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/organizerDB", {useNewUrlParser: true});

//DEFAULT LISTS
const defItemsArray = ["This is your TaskList!", "Click the checkbox to complete tasks", "Use the textbox and button below to add new tasks"];
const defNotesArray = [{title: "Notes List!", content: "This is a sample note! Use the form above to add new notes. Click the delete button to permanently delete a note from this list."}]

//USER SCHEMA AND MODEL
const userSchema = {
  fName: String,
  lName: String,
  email: String,
  password: String,
  tasksList: [{
    type: String
  }],
  notesList: [{
    type: Map,
    of: String
  }]
};

const User = new mongoose.model("User", userSchema);

//SIGNUP
app.get("/", function(req, res){
  res.render("signup", {incomplete: false});
});

app.get("/signup", function(req, res){
  res.render("signup", {incomplete: false});
});

app.post("/signup", function(req, res){
  const newUser = new User({
    fName: req.body.fName,
    lName: req.body.lName,
    email: req.body.email,
    password: req.body.password
  });

  if (req.body.fName == '' || req.body.lName == '' || req.body.email == '' || req.body.password == '') {
    res.render("signup", {incomplete: true});
  } else {
    newUser.save(function(err){
      if(err){
        console.log(err);
      } else {
        console.log(newUser);
        loggedIn = true;
        emailLoggedIn = newUser.email;
        User.findOneAndUpdate({email: req.body.email}, {tasksList: defItemsArray}, function(err){
          if(err) {
            console.log(err);
          } else {
            console.log("Successfully updated item in DB")
          }
        });

        User.findOneAndUpdate({email: req.body.email}, {notesList: defNotesArray}, function(err){
          if(err) {
            console.log(err);
          } else {
            console.log("Successfully updated notes in DB")
          }
        });
        res.redirect("todo");

      }
    });
  }
});

//LOGIN
app.get("/login", function(req, res){
  loggedIn = false;
  res.render("login", {
    tryAgainP: false,
    tryAgainE: false
  });
});

app.post("/login", function(req, res){
  const inputtedEmail = req.body.email;
  const inputtedPassword = req.body.password;

  User.findOne({email: inputtedEmail}, function(err, foundUser){
    if (err) {
      console.log(err);
    } else {
      if (foundUser) {
        if (foundUser.password === inputtedPassword) {
          loggedIn = true;
          emailLoggedIn = foundUser.email;
          res.redirect("/todo");
        } else {
          res.render("login",  {
            tryAgainP: true,
            tryAgainE: false
          });
        }
      } else {
        res.render("login",  {
          tryAgainP: false,
          tryAgainE: true
        });
      }
    }
  });
});


//HOME
app.get("/home", function(req, res){
  if (loggedIn) {
    User.findOne({email: emailLoggedIn}, function(err, userFound) {
      if (err) {
        console.log(err);
      } else {
        taskList = userFound.tasksList;
        res.render("todo", {
          taskList: userFound.tasksList
        })
      }
    });

  } else {
    res.render("login",  {
      tryAgainP: false,
      tryAgainE: false
    });
  }
});

// TASKLIST
app.get("/todo", function(req, res){
  if (loggedIn) {
    User.findOne({email: emailLoggedIn}, function(err, userFound) {
      taskList = userFound.tasksList;
      if (err) {
        console.log(err);
      } else {
        res.render("todo", {
          taskList: userFound.tasksList
        })
      }
    });

  } else {
    res.render("login",  {
      tryAgainP: false,
      tryAgainE: false
    });
  }
});

app.post("/todo", function(req, res){
  const newTaskName = req.body.newTask;
  taskList.push(newTaskName);
  User.findOneAndUpdate({email: emailLoggedIn}, {tasksList: taskList}, function(err){
    if(err) {
      console.log(err);
    } else {
      console.log("Successfully updated item in DB")
    }
  });

  res.redirect("/todo")
});

app.post("/deleteTask", function(req, res){
   const checkedTask = req.body.checkbox;

   const newTaskList = taskList.filter(task => task !== checkedTask);
   User.findOneAndUpdate({email: emailLoggedIn}, {tasksList: newTaskList}, function(err){
     if(err) {
       console.log(err);
     } else {
       console.log("Successfully updated item in DB");
       res.redirect("/todo");
     }
   });
});

//NOTES
app.get("/notes", function(req, res){
  if (loggedIn) {
    User.findOne({email: emailLoggedIn}, function(err, userFound) {
      noteList = userFound.notesList;
      if (err) {
        console.log(err);
      } else {
        res.render("notes", {
          noteList: userFound.notesList
        })
      }
    });
  } else {
    res.render("login",  {
      tryAgainP: false,
      tryAgainE: false
    });
  }
});

app.post("/addNote", function(req, res){
  const noteTitle = req.body.noteTitle;
  const noteContent = req.body.noteContent

  const newNote = {
    title: noteTitle,
    content: noteContent
  }

  noteList.push(newNote);
  User.findOneAndUpdate({email: emailLoggedIn}, {notesList: noteList}, function(err){
    if(err) {
      console.log(err);
    } else {
      console.log("Successfully updated item in DB")
    }
  });

  res.redirect("/notes")
});

app.post("/deleteNote", function(req, res){
   const submittedNoteIndex = req.body.deleteNote;
   noteList.splice(submittedNoteIndex, 1);
   User.findOneAndUpdate({email: emailLoggedIn}, {notesList: noteList}, function(err){
     if(err) {
       console.log(err);
     } else {
       console.log("Successfully deleted item in DB");
       res.redirect("/notes");
     }
   });
});


//TODO

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
