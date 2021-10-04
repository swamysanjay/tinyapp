const bcrypt = require('bcryptjs');
const urlDatabase = require('./express_server');
const users = require('./express_server');

const getUserByEmail = (email, database) => {
  return Object.values(database).find(user => user.email === email);
}

const addUser = (email, password) => {
  const hashPass = bcrypt.hashSync(password, 10);
  const id = generateRandomString();
  users[id] = {
    id,
    email,
    password: hashPass
  };
  return id;
}

const urlsForUser = (id) => {
  let filter = {};
  for (let urlID of Object.keys(urlDatabase)) {
    if (urlDatabase[urlID].userID === id) {
      filter[urlID] = urlDatabase[urlID];
    }
  }
  return filter;
}

const generateRandomString = function() {
  const array = ["A","B","C","D","E","F","G","H","I","J","K","L","M",
    "N","O","P","Q","R","S","T","U","V","W","X","Y","Z","a","b","c","d",
    "e","f","g","h","i","j","k","l","m","n","o","p","q","r","s","t","u",
    "v","w","x","y","z", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
  let randString = "";
  while (randString.length < 6) {
    let index = Math.floor(Math.random() * 61);
    randString += array[index];
  }
  return randString;
};

module.exports = {getUserByEmail, addUser, urlsForUser, generateRandomString};