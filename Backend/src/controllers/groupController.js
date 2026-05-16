import Group from "../models/Group.js";

const groupPayload = (group) => ({
  id: group._id.toString(),
  name: group.name,
  avatar: group.avatar || "",
  created_by: group.created_by.toString(),
  members: group.members.map((member) => ({
    id: member._id.toString(),
    name: member.name,
    email: member.email,
    profilePic: member.profilePic || "",
  })),
  created_at: group.created_at,
});

export const createGroup = async (req, res) => {
  try {
    const { name, memberIds = [], avatar = "" } = req.body;
    const cleanName = String(name || "").trim();

    if (!cleanName) {
      return res.status(400).json({ message: "Group name is required" });
    }

    const members = Array.from(new Set([req.user.id, ...memberIds.map(String)]));

    if (members.length < 2) {
      return res.status(400).json({ message: "Select at least one member" });
    }

    const group = await Group.create({
      name: cleanName,
      avatar,
      members,
      created_by: req.user.id,
    });

    const populated = await group.populate("members", "name email profilePic");
    res.status(201).json(groupPayload(populated));
  } catch (err) {
    console.error("CREATE GROUP ERROR:", err);
    res.status(500).json({ message: "Error creating group" });
  }
};

export const getGroups = async (req, res) => {
  try {
    const groups = await Group.find({ members: req.user.id })
      .populate("members", "name email profilePic")
      .sort({ updated_at: -1 })
      .lean();

    res.json(groups.map(groupPayload));
  } catch (err) {
    console.error("GET GROUPS ERROR:", err);
    res.status(500).json({ message: "Error fetching groups" });
  }
};
