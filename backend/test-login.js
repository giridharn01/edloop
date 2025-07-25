require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcryptjs');

async function testLogin() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://giridharan288:Gi9843256370@cluster0.xmreg.mongodb.net/edloop');
    console.log('Connected to MongoDB');
    
    // Set a known password
    const testPassword = 'test123';
    const hashedPassword = await bcrypt.hash(testPassword, 10);
    
    // Update password directly (bypassing pre-save middleware)
    await User.updateOne(
      { email: 'giridhar22112002@gmail.com' }, 
      { $set: { password_hash: hashedPassword } }
    );
    console.log('Password updated to: test123');
    
    // Test password verification
    const user = await User.findOne({ email: 'giridhar22112002@gmail.com' });
    const isValid = await user.comparePassword('test123');
    console.log('Password verification:', isValid);
    console.log('User details:', {
      username: user.username,
      email: user.email,
      displayName: user.display_name
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

testLogin();
