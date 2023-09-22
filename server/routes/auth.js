const express = require("express");
const router = express.Router();
const UserModel = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

//Register
router.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      res.status(400);
      throw new Error("Looks like you have missed the mandatory field!");
    }
    const existEmail = await UserModel.findOne({ email });
    if (existEmail) {
      res.status(400);
      throw new Error("Please use unique Email");
    }
    const existUsername = await UserModel.findOne({ username });
    if (existUsername) {
      res.status(400);
      throw new Error("Please use unique username");
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log("Hash Password: ", hashedPassword);
    if (hashedPassword) {
      const user = await UserModel.create({
        username,
        email,
        password: hashedPassword,
      });
      const savedUser = await user.save();
      console.log(`User created: ${savedUser}`);
      if (user) {
        res.status(201).json({ msg: "User Registration is Successful!" });
      } else {
        res.status(400);
        throw new Error("Registartion Failed");
      }
    }
  } catch (error) {
    res.status(500).json(error);
  }
});

//LOGIN
router.post("/login", async (req, res) => {
  try {
    const user = await UserModel.findOne({ email: req.body.email });
    if (!user) {
      return res.status(404).json("User not found!");
    }
    const match = await bcrypt.compare(req.body.password, user.password);
    if (!match) {
      return res.status(401).json("Wrong Credentials!");
    }
    const token = jwt.sign(
      { _id: user._id, username: user.username, email: user.email },
      process.env.SECRET,
      {
        expiresIn: "5d",
      }
    );
    const { password, ...info } = user._doc;
    res.cookie("token", token).status(200).json(info);
  } catch (error) {
    res.status(500).json(error);
  }
});

//LOGOUT
router.get("/logout", async (req, res) => {
  try {
    res
      .clearCookie("token", { sameSite: "none", secure: true })
      .status(200)
      .send("User logged out successfully!");
  } catch (error) {
    res.status(500).json(error);
  }
});

//REFETCH USER
router.get("/refetch", (req, res) => {
  const token = req.cookies.token;
  jwt.verify(token, process.env.SECRET, {}, async (err, data) => {
    if (err) {
      return res.status(404).json(err);
    }
    res.status(200).json(data);
  });
});

module.exports = router;
