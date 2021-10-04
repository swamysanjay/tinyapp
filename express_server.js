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
}

//ROUTES
// the / is for the homepage
app.get("/", (req, res) => {
  return res.redirect("/urls");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urs2.json", (req, res) => {
  res.json(users);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

//list of user's URLs
app.get("/urls", (req, res) => {
  let templateVars = {
    user: users[req.session.user_id],
    urls: urlsForUser(req.session.user_id, urlDatabase)
  }
  res.render("urls_index", templateVars);
});

//Page to create the short URL
app.get("/urls/new", (req, res) => {
  let templateVars = {
    user: users[req.session.user_id]
  };
  if (templateVars.user) {
    res.render("urls_new", templateVars);
  } else {
    res.render('urls_login', templateVars);
  }
});

//REGISTER
app.get("/register", (req,res) => {
  let templateVars = { user: users[req.session.user_id] };
  res.render("urls_register", templateVars);
});

//LOGIN
app.get("/login", (req, res) => {
  let templateVars = {
    user: users[req.session.user_id]
  };
  res.render("urls_login", templateVars);
})

app.post("/urls", (req, res) => {
  const longURL = req.body.longURL;
  const userID = req.session.user_id;
  const shortURL = generateRandomString();

  urlDatabase[shortURL] = {
    longURL,
    userID
  }
  res.redirect(`/urls/${shortURL}`);
});

app.get("/urls/:shortURL", (req, res) => {
  const shortURL =  req.params.shortURL;
  const user = users[req.session.user_id];
  console.log(Object.keys(urlDatabase));
  if (!user) {
    res.status(400).send("You need to login");
  }
  if (!Object.keys(urlDatabase).includes(shortURL)) {
      res.status(400).send("This URL is not found.");
  }
  const urls = urlsForUser(user.id, urlDatabase);
  const longURL = urlDatabase[shortURL].longURL;
  if (!urls[shortURL]) {
    res.status(400).send("This URL does not belong to you.");
  }
  const templateVars = { 
      longURL,
      shortURL,
      user, 
      urls
  };
    res.render("urls_show", templateVars);
});

//Access the actual longURL link
app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL].longURL;
  res.redirect(longURL);
});

//delete a short URL
app.post("/urls/:shortURL/delete", (req, res) => {
  const shortURL = req.params.shortURL;
  if (req.session.user_id === urlDatabase[shortURL].userID) {
    delete urlDatabase[req.params.shortURL];
    res.redirect("/urls");
  } else {
    res.status(400).send("You don't have permission to delete this URL.");
  }
});

app.post("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = req.body.longURL;

  const user = users[req.session.user_id];

  if (!user) {
    res.status(400).send("You don't have permission to delete this URL.");
  } 

    urlDatabase[shortURL].longURL = longURL;
    res.redirect(`/urls/`);
});

app.post("/login", (req,res) => {
  const { email, password } = req.body;
  const user = getUserByEmail(email, users);
  if (!user) {
    res.status(403).send("Email cannot be found");
  } else if (!bcrypt.compareSync(password, user.password)) {
    res.status(403).send("Wrong password");
  } else {
    req.session.user_id = user.id;
    res.redirect("/urls");
  }
});

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/urls");
})

app.post("/register", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).send('Email and/or password is missing');
  } else if (getUserByEmail(email, users)) {
    res.status(400).send('This email has already been registered')
  } else {
    const user_id = addUser(email, password);
    req.session.user_id = user_id;
    res.redirect("/urls");
  }
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

module.exports.users = users;