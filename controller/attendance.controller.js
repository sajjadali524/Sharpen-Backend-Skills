import Attendance from "../model/attendance.model.js";
import mongoose from "mongoose";

export const checkIn = async (req, res) => {
    try {
        const { userId } = req.body;
        const today = new Date().toISOString().split("T")[0];

        if(!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({message: "Invalid user id"})
        }

        const existingAttendance = await Attendance.findOne({
            user: userId,
            date: today
        });

        if(existingAttendance) {
            return res.status(409).json({message: "User already checked in today"})
        };

        const attendance = new Attendance({
            user: userId,
            date: today,
            checkIn: new Date(),
            status: "present",
        })

        await attendance.save();

        return res.status(201).json({success: true, message: "Check in successfully"})
    } catch (error) {
        return res.status(500).json({message: "Internal server error"})
    }
};

export const checkOut = async (req, res) => {
    try {
        const { userId } = req.body;
        const today = new Date().toISOString().split("T")[0];
        if(!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({message: "Invalid user id"})
        };

        const attendance = await Attendance.findOne({
            user: userId,
            date: today
        });

        if(!attendance) {
            return res.status(404).json({message: "User not checked in yet"})
        };

        if(attendance.checkOut) {
            return res.status(409).json({message: "User already logout"})
        };

        attendance.checkOut = new Date();

        return res.status(201).json({message: "User check out successfully"})
    } catch (error) {
        return res.status(500).json({message: error.message + "Internal server error"})
    }
};

export const attendanceReport = async (req, res) => {
  try {
    const { userId, from, to } = req.query;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    const filter = { user: userId };
    if (from && to) {
      filter.date = { $gte: from, $lte: to };
    }

    const attendance = await Attendance.find(filter).sort({ date: 1 });

    if (attendance.length === 0) {
      return res.status(404).json({ message: "No attendance exist for user" });
    }

    const report = attendance.map(ele => {
      const checkIn = ele.checkIn;
      const checkOut = ele.checkOut || new Date();
      const hoursWorked = checkIn ? ((checkOut - checkIn) / (1000 * 60 * 60)).toFixed(2) : "0.00";

      return {
        date: ele.date,
        checkIn,
        checkOut: ele.checkOut,
        hoursWorked,
        status: ele.status
      };
    });

    const totalHours = report.reduce((sum, r) => sum + Number(r.hoursWorked), 0);
    const totalDays = report.length;

    return res.status(200).json({
      userId,
      totalDays,
      totalHours: totalHours.toFixed(2),
      report
    });
  } catch (error) {
    console.error("Attendance report error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
