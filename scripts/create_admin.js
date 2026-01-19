const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();
const User = require('../src/models/User.model');

async function main() {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/e-comerce';
  await mongoose.connect(uri);
  const email = process.env.ADMIN_EMAIL || 'admin@example.com';
  const password = process.env.ADMIN_PASSWORD || 'Admin123!';
  const name = process.env.ADMIN_NAME || 'Admin';

  let user = await User.findOne({ email });
  if (user) {
    console.log('Admin user already exists:', email);
    process.exit(0);
  }

  user = new User({ name, email, password, role: 'ADMIN' });
  await user.save();
  console.log('Admin user created:', email, 'password:', password);
  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
