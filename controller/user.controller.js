import User from "../model/user.model.js";
import bcrypt from "bcrypt";
import mongoose from "mongoose";

export const createUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if(!name) {
            return res.status(400).json({message: "Name is required"})
        }
        if(!email || !email.includes('@')) {
            return res.status(400).json({message: "Please fill email field or enter correct email"})
        }
        if(!password || password.length < 6) {
            return res.status(400).json({message: "Password must be atleast 6 character long"})
        }
        let user = await User.findOne({email})
        if(user) {
            return res.status(409).json({message: "User already registerd!"})
        };

        const hashPassword = await bcrypt.hash(password, 10);

        user = new User({
            name: name,
            email: email,
            password: hashPassword
        });
        await user.save();

        return res.status(201).json({success: true, message: "User created successfully!"})
    } catch (error) {
        return res.status(500).json({message: "Internal server error"})
    };
};

export const getUserById = async (req, res) => {
    try {
        const {id} = req.params;
        if(!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({message: "Invalid id"})
        }
        const user = await User.findById(id);
        if(!user) {
            return res.status(404).json({message: "User not exist"})
        }

        return res.status(200).json({
            id: user._id,
            name: user.name,
            email: user.email,
            createdAt: user.createdAt
        })
    } catch (error) {
        return res.status(500).json({message: "Internal server error"})
    }
};

export const getUsersWithPagination = async (req, res) => {
    try {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 5;

        if(page < 1 || limit < 1) {
            return res.status(400).json({message: "Invalid paginatiions"})
        };

        const totalUser = await User.countDocuments();

        const skip = (page - 1) * limit;
        let userData = await User.find().skip(skip).limit(limit);
        const users = userData.map(ele => ({
            id: ele._id,
            name: ele.name,
            email: ele.email,
            createdAt: ele.createdAt
        }));

        return res.status(200).json({
            users,
            totalUser,
            page,
            limit,
        })
    } catch (error) {
        return res.status(500).json({message: "Internal server error"})
    }
};

export const searchUsersWithPagination = async (req, res) => {
    try {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 5;
        const search = req.query.search;

        if(page < 1 || limit < 1) {
            return res.status(400).json({message: "Invalid pages or limits"})
        };

        const filter = search ? {
            $or: [
                {name: {$regex: search, $options: "i"} },
                {email: {$regex: search, $options: "i"} }
            ]
        }: {};

        const skip = (page - 1) * limit;
        const totalUser = await User.countDocuments(filter);
        const userData = await User.find(filter).sort({createdAt: -1}).skip(skip).limit(limit);

        const users = userData.map(ele => ({
            id: ele._id,
            name: ele.name,
            email: ele.email,
            createdAt: ele.createdAt
        }));

        return res.status(200).json({
            users,
            page,
            limit,
            totalUser
        });
    } catch (error) {
        return res.status(500).json({message: "Internal server error"})
    }
};