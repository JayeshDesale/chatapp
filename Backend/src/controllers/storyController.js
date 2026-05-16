import Story from "../models/Story.js";

const storyPayload = (story) => ({
  id: story._id.toString(),
  user_id: story.user_id._id ? story.user_id._id.toString() : story.user_id.toString(),
  user_name: story.user_id.name,
  user_profile_pic: story.user_id.profilePic || "",
  image: story.image,
  caption: story.caption,
  created_at: story.created_at,
  expires_at: story.expires_at,
});

export const createStory = async (req, res) => {
  try {
    const { image, caption = "" } = req.body;

    if (!image) {
      return res.status(400).json({ message: "Story image is required" });
    }

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const story = await Story.create({
      user_id: req.user.id,
      image,
      caption,
      expires_at: expiresAt,
    });

    const populated = await story.populate("user_id", "name profilePic");
    res.status(201).json(storyPayload(populated));
  } catch (err) {
    console.error("CREATE STORY ERROR:", err);
    res.status(500).json({ message: "Error creating story" });
  }
};

export const getStories = async (req, res) => {
  try {
    const stories = await Story.find({ expires_at: { $gt: new Date() } })
      .populate("user_id", "name profilePic")
      .sort({ created_at: -1 })
      .lean();

    res.json(stories.map(storyPayload));
  } catch (err) {
    console.error("GET STORIES ERROR:", err);
    res.status(500).json({ message: "Error fetching stories" });
  }
};
