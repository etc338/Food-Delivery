import User from "../models/user.model.js";

export const getCurrentUser = async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({ message: 'userId is not found' });
        }
        const user = await User.findById(userId).select('-password -resetOtp -otpExpires -isOtpVerified -createdAt -updatedAt -__v');
        if(!user){
            return res.status(404).json({ message: 'User not found' });
        }
        return res.status(200).json( user );

    } catch (error) {
        return res.status(500).json({ message: "Server Error", error: error.message });
    }
}

export const updateUserLocation = async (req, res) => {
    try {
        const { latitude, longitude } = req.body;
        const user =  await User.findByIdAndUpdate(
            req.userId,
            {location: { type: 'Point', coordinates: [longitude, latitude] }}, { new: true })

        if (!user) {
            return res.status(401).json({ message: 'userId is not found' });
        }

        return res.status(200).json({ message: 'Location updated successfully', user });
    } catch (error) {
        return res.status(500).json({ message: "Server Error", error: error.message });
    }
}