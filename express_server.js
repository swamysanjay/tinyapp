const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
const bcrypt = require('bcryptjs');
const cookieSession = require('cookie-session');
const {getUserByEmail, generateRandomString, urlsForUser, addUser} = require('./helpers');

app.use(bodyParser.urlencoded({extended:true}));
app.use(
  cookieSession({
    name: 'session',
    keys: ['SWAMSWAMS']
  })
);

app.set("view engine", "ejs");

//Databases
const urlDatabase = {
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    userID: "userRandomID"
  },
  "9sm5xK": {
    longURL: "http://www.google.com",
    userID: "user2RandomID"
  }
};

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};

//ROUTES
// the / is for the homepage
app.get("/", (req, res) => {
  const user = users[req.session.userID];

  if (!user) {
    return res.redirect("/login");
  }
  res.redirect("/urls");
});

//list of user's URLs
app.get("/urls", (req, res) => {
  let templateVars = {
    user: users[req.session.userID],
    urls: urlsForUser(req.session.userID, urlDatabase)
  };
  return res.render("urls_index", templateVars);
});

//Page to create the short URL
app.get("/urls/new", (req, res) => {
  let templateVars = {
    user: users[req.session.userID]
  };
  if (templateVars.user) {
    return res.render("urls_new", templateVars);
  } else {
    return res.render('urls_login', templateVars);
  }
});

//REGISTER
app.get("/register", (req,res) => {
  let templateVars = { user: users[req.session.userID] };
  return res.render("urls_register", templateVars);
});

//LOGIN
app.get("/login", (req, res) => {
  let templateVars = {
    user: users[req.session.userID]
  };
  return res.render("urls_login", templateVars);
});

app.post("/urls", (req, res) => {
  const longURL = req.body.longURL;
  const userID = req.session.userID;

  if (!userID) {
    return res.status(400).send("Must be <a href = '/login'>logged in</a> to complete this action");
  }

  const shortURL = generateRandomString();

  urlDatabase[shortURL] = {
    longURL,
    userID
  };

  return res.redirect(`/urls/${shortURL}`);
});

app.get("/urls/:shortURL", (req, res) => {
  const shortURL =  req.params.shortURL;
  const user = users[req.session.userID];
  console.log(Object.keys(urlDatabase));
  if (!user) {
    return res.status(400).send("You need to login");
  }
  if (!Object.keys(urlDatabase).includes(shortURL)) {
    return res.status(400).send("This URL is not found.");
  }
  const urls = urlsForUser(user.id, urlDatabase);
  const longURL = urlDatabase[shortURL].longURL;
  if (!urls[shortURL]) {
    return res.status(400).send("This URL does not belong to you.");
  }
  const templateVars = {
    longURL,
    shortURL,
    user,
    urls
  };
  return res.render("urls_show", templateVars);
});

//Access the actual longURL link
app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  if (!urlDatabase[shortURL]) {
    return res.status(404).send("URL not found");
  }
  const longURL = urlDatabase[shortURL].longURL;
  
  return res.redirect(longURL);
});

//delete a short URL
app.post("/urls/:shortURL/delete", (req, res) => {
  const shortURL = req.params.shortURL;
  if (req.session.userID === urlDatabase[shortURL].userID) {
    delete urlDatabase[req.params.shortURL];
    return res.redirect("/urls");
  } else {
    return res.status(400).send("You don't have permission to delete this URL.");
  }
});

app.post("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = req.body.longURL;

  const user = users[req.session.userID];

  if (!user) {
    return res.status(400).send("You don't have permission to edit this URL.");
  }

  urlDatabase[shortURL].longURL = longURL;
  return res.redirect(`/urls/`);
});

app.post("/login", (req,res) => {
  const { email, password } = req.body;
  const user = getUserByEmail(email, users);
  if (!user) {
    return res.status(403).send("Email cannot be found");
  } else if (!bcrypt.compareSync(password, user.password)) {
    return res.status(403).send("Wrong password");
  } else {
    req.session.userID = user.id;
    return res.redirect("/urls");
  }
});

app.post("/logout", (req, res) => {
  req.session = null;
  return res.redirect("/urls");
});

app.post("/register", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).send('Email and/or password is missing');
  } else if (getUserByEmail(email, users)) {
    return res.status(400).send('This email has already been registered');
  } else {
    const userID = addUser(email, password);
    req.session.userID = userID;
    return res.redirect("/urls");
  }
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

module.exports.users = users;