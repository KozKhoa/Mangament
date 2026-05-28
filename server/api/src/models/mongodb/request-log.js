import mongoose from "mongoose";

const REQUEST_LOGS_TTL = 60 * 60 * 24 * 30; // 30 day

const requestLogSchema = new mongoose.Schema(
  {
    requestId: {
      type: String,
      required: true,
      unique: true,
    },

    method: {
      type: String,
      required: true,
      trim: true,
    },

    protocol: {
      type: String,
      required: true,
      trim: true,
    },

    httpVersion: {
      type: String,
      required: true,
    },

    host: {
      type: String,
      required: true,
    },

    url: {
      type: String,
      required: true,
    },

    query: {
      type: mongoose.Schema.Types.Mixed,
    },

    params: {
      type: mongoose.Schema.Types.Mixed,
    },

    path: {
      type: String,
      required: true,
    },

    statusCode: {
      type: Number,
      required: true,
    },

    ip: {
      type: String,
    },

    userAgent: {
      type: String,
    },

    responseTime: {
      type: Number,
    },

    requestBody: {
      type: mongoose.Schema.Types.Mixed,
    },

    responseBody: {
      type: mongoose.Schema.Types.Mixed,
    },

    userId: {
      type: String,
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    versionKey: "_version",
    versionKey: false,
  },
);

requestLogSchema.index({ createdAt: -1 }, { expireAfterSeconds: REQUEST_LOGS_TTL });
requestLogSchema.index({ method: 1, statusCode: 1 });

export const RequestLog = mongoose.model("RequestLog", requestLogSchema);
