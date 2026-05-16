import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    sender_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiver_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    group_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      default: null,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    read_status: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    versionKey: false,
  }
);

messageSchema.index({ sender_id: 1, receiver_id: 1, created_at: 1 });
messageSchema.index({ group_id: 1, created_at: 1 });

const Message = mongoose.model("Message", messageSchema);

export default Message;
