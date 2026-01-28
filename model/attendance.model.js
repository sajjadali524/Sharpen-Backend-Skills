import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "User"
    },
    date: {
        type: String,
        required: true
    }, 
    checkIn: {
        type: Date,
    },
    checkOut: {
        type: Date
    },
    status: {
        type: String,
        required: true,
        enum: ["present", "absent"],
        default: "absent"
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

attendanceSchema.index({user: 1, date: 1}, {unique: true});

const Attendance = mongoose.model("Attendance", attendanceSchema);

export default Attendance;