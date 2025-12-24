const bcrypt = require('bcryptjs');

const users = [
  {
    name: 'Napster Admin',
    email: 'admin@napster.com',
    phone: '0240000000', // <--- Added Fake Phone
    password: bcrypt.hashSync('123456', 10), 
    isAdmin: true,
  },
  {
    name: 'Test Customer',
    email: 'customer@napster.com',
    phone: '0241111111', // <--- Added Fake Phone
    password: bcrypt.hashSync('123456', 10),
    isAdmin: false,
  },
];

module.exports = users;