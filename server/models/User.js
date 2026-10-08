const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email address'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false,
    },
    // Everyone registers as 'user'. 'admin' is only ever set via the
    // createAdmin.js CLI script — there is no self-service way to become one.
    // "Local" status is no longer a global role; see localAreas below.
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    // GeoJSON Point representing the user's saved home/base location.
    // No `default: 'Point'` on the nested type field — Mongoose applies
    // leaf-level defaults even when the parent object is never touched,
    // which previously caused every new user to get a malformed
    // { type: "Point" } with no coordinates, crashing the 2dsphere index.
    homeLocation: {
      type: {
        type: String,
        enum: ['Point'],
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        validate: {
          validator: function (coords) {
            if (!coords) return true;
            return (
              coords.length === 2 &&
              coords[0] >= -180 &&
              coords[0] <= 180 &&
              coords[1] >= -90 &&
              coords[1] <= 90
            );
          },
          message: 'Invalid coordinates — must be [longitude, latitude]',
        },
      },
    },
    // Places this user has declared themselves local to. Each entry is
    // independently admin-verified — being verified for one area does NOT
    // make the user "local" anywhere else. A tip can only be posted at a
    // place that falls inside the radius of one of the user's VERIFIED areas.
    localAreas: {
      type: [
        {
          label: {
            type: String,
            trim: true,
            maxlength: [100, 'Label cannot exceed 100 characters'],
            required: [true, 'A label for this area is required'],
          },
          location: {
            type: {
              type: String,
              enum: ['Point'],
              default: 'Point',
            },
            coordinates: {
              type: [Number], // [longitude, latitude]
              required: [true, 'Area coordinates are required'],
              validate: {
                validator: function (coords) {
                  return (
                    coords.length === 2 &&
                    coords[0] >= -180 &&
                    coords[0] <= 180 &&
                    coords[1] >= -90 &&
                    coords[1] <= 90
                  );
                },
                message: 'Invalid coordinates — must be [longitude, latitude]',
              },
            },
          },
          radiusKm: {
            type: Number,
            min: [1, 'Radius must be at least 1km'],
            max: [50, 'Radius cannot exceed 50km'],
            required: [true, 'Radius is required'],
          },
          isVerified: {
            type: Boolean,
            default: false,
          },
          createdAt: {
            type: Date,
            default: Date.now,
          },
        },
      ],
      default: [],
    },
    preferences: {
      type: [String],
      default: [],
    },
    karma: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

userSchema.index({ homeLocation: '2dsphere' }, { sparse: true });

userSchema.pre('save', function (next) {
  if (this.homeLocation && this.homeLocation.coordinates && this.homeLocation.coordinates.length === 2) {
    this.homeLocation.type = 'Point';
  } else {
    this.homeLocation = undefined;
  }
  next();
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);