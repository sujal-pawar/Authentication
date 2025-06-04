const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    method: {
      type: String,
      enum: ['local', 'google', 'facebook'],
      required: true
    },
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please add a valid email']
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user'
    },
    avatar: {
      type: String
    },
    // Local auth (for future use if needed)
    local: {
      email: {
        type: String,
        lowercase: true,
        sparse: true
      },
      password: {
        type: String,
        select: false
      }
    },
    // Google auth
    google: {
      id: {
        type: String,
        sparse: true
      },
      email: {
        type: String,
        lowercase: true
      }
    },
    // Facebook auth
    facebook: {
      id: {
        type: String,
        sparse: true
      },
      email: {
        type: String,
        lowercase: true
      }
    }
  },
  {
    timestamps: true
  }
);

// Middleware to hash password before save (for local auth if needed in future)
userSchema.pre('save', async function (next) {
  try {
    if (this.method !== 'local') {
      return next();
    }

    if (!this.isModified('local.password')) {
      return next();
    }

    const salt = await bcrypt.genSalt(10);
    this.local.password = await bcrypt.hash(this.local.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password (for local auth if needed in future)
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.local.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User;
