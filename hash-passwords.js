const CryptoJS = require("crypto-js");

const users = [
  {
    id: 1,
    username: "ankit",
    password: "password123",
  },
  {
    id: 2,
    username: "vishal",
    password: "password456",
  },
];

const hashedUsers = users.map((user) => ({
  ...user,
  password: CryptoJS.SHA256(user.password).toString(),
}));

console.log(JSON.stringify(hashedUsers, null, 2));
