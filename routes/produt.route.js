import express from "express";
import { monthlySales, topProducts } from "../controller/products.controller.js";
const router = express.Router();

router.get("/report", topProducts);
router.get("/monthly-report", monthlySales);

export default router;