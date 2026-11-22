/*
 * Seeds the database with demo users, items and claims.
 * Run with:  npm run seed   (stop the server first)
 * WARNING: this clears the existing users, items and claims.
 * The server also calls seedData() automatically when the database is empty.
 */
require('dotenv').config();
const { connectDB, disconnectDB } = require('./config/db');
const User = require('./models/User');
const Item = require('./models/Item');
const Claim = require('./models/Claim');

const daysAgo = (n) => new Date(Date.now() - n * 86400000);

async function seedData() {
  await Promise.all([User.deleteMany({}), Item.deleteMany({}), Claim.deleteMany({})]);

  const users = await User.create([
    { name: 'Portal Admin', email: 'admin@lostfound.edu', password: 'admin123', role: 'admin' },
    { name: 'Ananya Rao', email: 'ananya@student.edu', password: 'student123', usn: '1MS23CS021', phone: '9876500001' },
    { name: 'Rahul Verma', email: 'rahul@student.edu', password: 'student123', usn: '1MS23CS102', phone: '9876500002' },
    { name: 'Sneha Patil', email: 'sneha@student.edu', password: 'student123', usn: '1MS23IS045', phone: '9876500003' },
    { name: 'Karthik Nair', email: 'karthik@student.edu', password: 'student123', usn: '1MS23EC067', phone: '9876500004' },
    { name: 'Meera Iyer', email: 'meera@student.edu', password: 'student123', usn: '1MS23ME012', phone: '9876500005' },
  ]);
  const [, ananya, rahul, sneha, karthik, meera] = users;

  const items = await Item.create([
    { type: 'lost', title: 'Black boAt Airdopes earbuds', description: 'Black boAt Airdopes 141 in a matte black case. Has a small scratch on the lid. Lost after the morning lab session.', category: 'Electronics', location: 'CSE Block, Lab 3', date: daysAgo(1), image: '/uploads/seed-earbuds.png', postedBy: ananya._id, contactInfo: 'WhatsApp 9876500001' },
    { type: 'found', title: 'Black wireless earbuds case', description: 'Found a black earbuds case (boAt) on the bench outside CSE Lab 3. Kept with me, describe the scratch to claim.', category: 'Electronics', location: 'Outside CSE Lab 3', date: daysAgo(1), image: '/uploads/seed-earbuds.png', postedBy: rahul._id },
    { type: 'found', title: 'College ID card - 1MS23 batch', description: 'Blue lanyard with a college ID card. Name partially faded. Found near the main gate in the evening.', category: 'ID Card / Documents', location: 'Main Gate', date: daysAgo(2), image: '/uploads/seed-idcard.png', postedBy: sneha._id },
    { type: 'lost', title: 'Brown leather wallet', description: 'Brown leather wallet with my Aadhaar copy, some cash and a metro card. Probably dropped in the canteen during lunch.', category: 'Wallet / Money', location: 'Main Canteen', date: daysAgo(3), image: '/uploads/seed-wallet.png', postedBy: karthik._id, contactInfo: 'Call 9876500004' },
    { type: 'found', title: 'Bunch of keys with red keychain', description: 'Three keys (one bike key - Honda) on a red keychain. Found in the parking area near the library.', category: 'Keys', location: 'Library Parking', date: daysAgo(2), image: '/uploads/seed-keys.png', postedBy: meera._id },
    { type: 'lost', title: 'Honda bike key with red keychain', description: 'Lost my Honda Activa key along with two house keys on a red keychain somewhere near the library.', category: 'Keys', location: 'Library', date: daysAgo(3), image: '/uploads/seed-keys.png', postedBy: rahul._id, contactInfo: 'rahul@student.edu' },
    { type: 'lost', title: 'Engineering Mathematics textbook', description: 'B.S. Grewal Higher Engineering Mathematics, my name written on the first page. Left in Room 204.', category: 'Books & Stationery', location: 'Room 204, Main Block', date: daysAgo(5), image: '/uploads/seed-book.png', postedBy: sneha._id },
    { type: 'found', title: 'Blue Milton water bottle', description: 'Steel water bottle, blue colour with a sticker of a mountain. Found in the auditorium after the seminar.', category: 'Water Bottle', location: 'Apex Auditorium', date: daysAgo(4), image: '/uploads/seed-bottle.png', postedBy: ananya._id },
    { type: 'lost', title: 'Grey Wildcraft backpack', description: 'Grey Wildcraft backpack with a laptop charger and two notebooks inside. Left it in the reading hall.', category: 'Bags', location: 'Central Library Reading Hall', date: daysAgo(6), image: '/uploads/seed-bag.png', postedBy: meera._id, contactInfo: 'Call 9876500005' },
    { type: 'found', title: 'Casio scientific calculator', description: 'Casio fx-991ES Plus found in the exam hall after the internal test. Has initials scratched on the back.', category: 'Electronics', location: 'Exam Hall B', date: daysAgo(2), image: '/uploads/seed-calculator.png', postedBy: karthik._id },
    { type: 'lost', title: 'Black hoodie (size M)', description: 'Black hoodie with the college fest logo on the back. Left on the chair at the basketball court.', category: 'Clothing & Accessories', location: 'Basketball Court', date: daysAgo(7), image: '/uploads/seed-hoodie.png', postedBy: rahul._id },
    { type: 'found', title: 'Silver analog wrist watch', description: 'Silver Titan watch with a metal strap found in the gents washroom on the 2nd floor of ISE block.', category: 'Clothing & Accessories', location: 'ISE Block, 2nd floor', date: daysAgo(8), image: '/uploads/seed-watch.png', postedBy: sneha._id, status: 'claimed' },
    { type: 'lost', title: 'USB pen drive 64GB (SanDisk)', description: 'SanDisk 64GB pen drive with my project files. Red and black colour. Lost in the computer centre.', category: 'Electronics', location: 'Computer Centre', date: daysAgo(10), image: '/uploads/seed-pendrive.png', postedBy: ananya._id, status: 'resolved' },
  ]);

  const byTitle = (t) => items.find((i) => i.title === t);
  await Claim.create([
    { item: byTitle('Black wireless earbuds case')._id, claimant: ananya._id, message: 'These are mine! boAt Airdopes 141, there is a small scratch on the top of the lid near the hinge. I lost them after Lab 3.' },
    { item: byTitle('Bunch of keys with red keychain')._id, claimant: rahul._id, message: 'My keys - Honda Activa key plus two house keys, the keychain is red with a small bell.' },
    { item: byTitle('Brown leather wallet')._id, claimant: meera._id, message: 'I think I saw this wallet at the canteen counter, I handed something similar to the canteen staff. I can show you.' },
    { item: byTitle('Silver analog wrist watch')._id, claimant: karthik._id, message: 'It is my Titan watch, the back has an engraving "K.N. 2023".', status: 'approved' },
  ]);

  console.log('Demo data loaded:');
  console.log('  Admin   -> admin@lostfound.edu / admin123');
  console.log('  Student -> ananya@student.edu / student123 (also rahul, sneha, karthik, meera)');
}

module.exports = { seedData };

// Run directly: node src/seed.js
if (require.main === module) {
  connectDB()
    .then(seedData)
    .then(disconnectDB)
    .catch(async (err) => {
      console.error(err);
      await disconnectDB();
      process.exit(1);
    });
}
