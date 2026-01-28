import express from "express";
import { createUser, getUserById, getUsersWithPagination, searchUsersWithPagination } from "../controller/user.controller.js";

const router = express.Router();

router.post("/users", createUser);
router.get("/user/:id", getUserById);
router.get("/users", getUsersWithPagination);
router.get("/filter-users", searchUsersWithPagination);

export default router;