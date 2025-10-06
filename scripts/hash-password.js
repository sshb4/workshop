const bcrypt = require('bcryptjs');

const password = 'password123'; // Change this to whatever you want
const hashed = bcrypt.hashSync(password, 10);

console.log('Password:', password);
console.log('Hashed:', hashed);
console.log('\nUpdate your teacher in Prisma Studio with this hash!');