import express from "express";
import { attendanceReport, checkIn, checkOut } from "../controller/attendance.controller.js";

const router = express.Router();

router.post("/attendance/check-in", checkIn);
router.put("/attendance/check-out", checkOut);
router.get("/attendance/report", attendanceReport);

export default router;