import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

const optionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  pros: [{
    type: String,
    trim: true,
    maxlength: 200
  }],
  cons: [{
    type: String,
    trim: true,
    maxlength: 200
  }]
});

const commentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  text: {
    type: String,
    required: true,
    trim: true,
    maxlength: 300
  }
}, { timestamps: true });

const voteSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  optionId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  }
}, { timestamps: true });

const decisionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      minlength: [1, "Title must be at least 1 character long"],
      maxlength: [100, "Title cannot exceed 100 characters"]
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      minlength: [1, "Description must be at least 1 character long"],
      maxlength: [1000, "Description cannot exceed 1000 characters"]
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      enum: {
        values: ["career", "finance", "health", "personal", "education", "relationships", "other"],
        message: "Invalid category"
      }
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    confidenceLevel: {
      type: Number,
      min: [0, "Confidence level must be at least 0"],
      max: [100, "Confidence level cannot exceed 100"],
      default: 50
    },
    decisionDate: {
      type: Date,
      default: Date.now,
      validate: {
        validator: function(date) {
          return date <= new Date();
        },
        message: "Decision date cannot be in the future"
      }
    },
    options: {
      type: [optionSchema],
      validate: {
        validator: function(options) {
          return options && options.length >= 2;
        },
        message: "At least two options are required"
      }
    },
    expectedOutcome: {
      type: String,
      trim: true,
      maxlength: [500, "Expected outcome cannot exceed 500 characters"]
    },
    reviewDate: {
      type: Date,
      required: [true, "Review date is required"],
      validate: {
        validator: function(date) {
          return date > new Date();
        },
        message: "Review date must be in the future"
      }
    },
    isReviewed: {
      type: Boolean,
      default: false
    },
    actualOutcome: {
      type: String,
      trim: true,
      maxlength: [1000, "Actual outcome cannot exceed 1000 characters"],
      validate: {
        validator: function(value) {
          if (this.isReviewed) {
            return value && value.trim().length > 0;
          }
          return true;
        },
        message: "Actual outcome is required when decision is reviewed"
      }
    },
    successRating: {
      type: Number,
      min: [1, "Success rating must be at least 1"],
      max: [5, "Success rating cannot exceed 5"],
      validate: {
        validator: function(value) {
          if (this.isReviewed) {
            return value !== undefined && value !== null;
          }
          return true;
        },
        message: "Success rating is required when decision is reviewed"
      }
    },
    lessonsLearned: {
      type: String,
      trim: true,
      maxlength: [1000, "Lessons learned cannot exceed 1000 characters"]
    },
    isPublic: {
      type: Boolean,
      default: false
    },
    likes: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }],
    comments: [commentSchema],
    seekingAdvice: {
      type: Boolean,
      default: false
    },
    tags: [{
      type: String,
      trim: true,
      maxlength: 30
    }],
    // New poll fields
    poll: {
      enabled: {
        type: Boolean,
        default: false
      },
      votes: [voteSchema]  // Array of votes, each with user and optionId
    }
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual for like count
decisionSchema.virtual('likeCount').get(function() {
  return this.likes.length;
});

// Virtual for comment count
decisionSchema.virtual('commentCount').get(function() {
  return this.comments.length;
});

// New virtual for poll vote counts per option
decisionSchema.virtual('pollVoteCounts').get(function() {
  const counts = {};
  this.options.forEach((option) => {
    counts[option._id.toString()] = 0;
  });
  this.poll.votes.forEach((vote) => {
    const optionIdStr = vote.optionId.toString();
    if (counts[optionIdStr] !== undefined) {
      counts[optionIdStr]++;
    }
  });
  return counts;
});


// Ensure unique votes per user (prevent multiple votes from same user)
decisionSchema.index({ 'poll.votes.user': 1 }, { unique: true, partialFilterExpression: { 'poll.enabled': true } });

// Indexes (existing)
decisionSchema.index({ user: 1, createdAt: -1 });
decisionSchema.index({ isPublic: 1, createdAt: -1 });
decisionSchema.index({ category: 1 });
decisionSchema.index({ reviewDate: 1 });
decisionSchema.index({ isReviewed: 1 });

// Add pagination plugin
decisionSchema.plugin(mongoosePaginate);

// Pre-save middleware to handle review logic (existing)
decisionSchema.pre('save', function(next) {
  if (this.isReviewed && this.isModified('isReviewed')) {
    if (!this.actualOutcome || !this.actualOutcome.trim()) {
      return next(new Error("Actual outcome is required when marking decision as reviewed"));
    }
    if (this.successRating === undefined || this.successRating === null) {
      return next(new Error("Success rating is required when marking decision as reviewed"));
    }
  }
  next();
});

export default mongoose.model("Decision", decisionSchema);