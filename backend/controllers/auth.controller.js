import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import genToken from "../utilis/token.js";
import { sendOtpMail } from "../utilis/mail.js";

export const signUp = async (req, res) => {
  try {
    const { fullName, email, password, mobile, role } = req.body;

    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: "User already exists" });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });
    }

    if (mobile.length < 10) {
      return res
        .status(400)
        .json({ message: "mobile no must be at least 10 digits" });
    }

    const harshedpassword = await bcrypt.hash(password, 10);
    user = await User.create({
      fullName,
      email,
      password: harshedpassword,
      mobile,
      role,
    });

    const token = await genToken(user._id);
    res.cookie("token", token, {
      secure: false,
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      httpOnly: true,
    });

    return res
      .status(201)
      .json({ message: "User created successfully", user, token });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server Error", error: error.message });
  }
};

export const signIn = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User does not exist" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = await genToken(user._id);
    res.cookie("token", token, {
      secure: false,
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      httpOnly: true,
    });

    return res
      .status(200)
      .json({ message: "User login successfully", user, token });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server Error", error: error.message });
  }
};

export const signOut = async (req, res) => {
  try {
    res.clearCookie("token");
    return res.status(200).json({ message: "User signout successfully" });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server Error", error: error.message });
  }
};

export const sendotp = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User does not exist" });
    }
    // generate otp
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    user.resetOtp = otp;
    user.otpExpires = Date.now() + 5 * 60 * 1000; // 5 minutes
    user.isOtpVerified = false;
    await user.save();

    // send otp to email
    await sendOtpMail(email, otp);
    res.status(200).json({ message: "OTP sent to email" });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server Error", error: error.message });
  }
};

export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });
    if (!user || !user.resetOtp || user.otpExpires < Date.now()) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }
    user.isOtpVerified = true;
    user.resetOtp = undefined;
    user.resetOtp = undefined;
    await user.save();
    return res.status(200).json({ message: "OTP verified successfully" });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server Error", error: error.message });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    const user = await User.findOne({ email });
    if (!user || !user.isOtpVerified) {
      return res.status(400).json({ message: "OTP not verified" });
    }
    const harshedpassword = await bcrypt.hash(newPassword, 10);
    user.password = harshedpassword;
    user.isOtpVerified = false;
    await user.save();
    return res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server Error", error: error.message });
  }
};

export const googleAuth = async (req, res) => {
  try {
    const { fullName, email, mobile, role } = req.body;
    let user = await User.findOne({ email });
    if (!user) {
      if (!mobile || !role) {
        return res
          .status(400)
          .json({
            message:
              "Missing required fields for account creation. Please sign up first.",
          });
      }
      user = await User.create({
        fullName,
        email,
        mobile,
        role,
      });
    }
    const token = await genToken(user._id);
    res.cookie("token", token, {
      secure: false,
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      httpOnly: true,
    });
    return res.status(200).json({ message: "User login successfully", user });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server Error", error: error.message });
  }
};
