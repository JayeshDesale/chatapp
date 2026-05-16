import User from "../models/User.js";

export const getUsers = async (req, res) => {
  try {
    const currentUserId = req.user.id;

    const users = await User.find({ _id: { $ne: currentUserId } })
      .select("_id name email profilePic")
      .sort({ name: 1 })
      .lean();

    res.json(
      users.map((user) => ({
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        profilePic: user.profilePic || "",
      }))
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching users" });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { profilePic } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { profilePic: profilePic || "" },
      { new: true }
    ).select("_id name email profilePic");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      profilePic: user.profilePic || "",
    });
  } catch (err) {
    console.error("UPDATE PROFILE ERROR:", err);
    res.status(500).json({ message: "Error updating profile" });
  }
};
