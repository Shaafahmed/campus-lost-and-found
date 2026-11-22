const jwt = require('jsonwebtoken');

function signToken(user) {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

function publicUser(user) {
  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    usn: user.usn,
    phone: user.phone,
    role: user.role,
    createdAt: user.createdAt,
  };
}

module.exports = { signToken, publicUser };
