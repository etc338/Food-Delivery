import express from 'express';
import { googleAuth, resetPassword, sendotp, signIn, signOut, signUp, verifyOtp } from '../controllers/auth.controller.js';

const authRoutes = express.Router();

authRoutes.post('/signup', signUp);
authRoutes.post('/signin', signIn);
authRoutes.get('/signout', signOut);
authRoutes.post('/send-otp', sendotp);
authRoutes.post('/verify-otp', verifyOtp);
authRoutes.post('/reset-password', resetPassword);
authRoutes.post('/google-auth', googleAuth);

export default authRoutes;