import express from "express";
import { customerCohort, customerLifetimeValue, monthlySales, topProducts } from "../controller/products.controller.js";
const router = express.Router();

router.get("/report", topProducts);
router.get("/monthly-report", monthlySales);
router.get("/customer-value", customerLifetimeValue);
router.get("/customer-cohort", customerCohort);

export default router;