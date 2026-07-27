const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Service name is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    duration: {
      // duration in minutes
      type: Number,
      required: [true, 'Duration in minutes is required'],
      min: 5,
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: 0,
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
  },
  { timestamps: { createdAt: 'createdDate', updatedAt: 'updatedDate' } }
);

module.exports = mongoose.model('Service', serviceSchema);
