import Tag from "../models/tag.model.js";
import logger from "../../utils/logger.js";
import xss from "xss";

// Function to get all tags
const getAllTags = async (req, res) => {
  try {
    const tags = await Tag.find({});

    if (tags.length === 0) {
      logger.info("No tags found in the database");
      return res.status(200).json({ success: true, tags: [] });
    }

    res.status(200).json({ success: true, tags });
  } catch (error) {
    logger.error(`Error fetching tags: ${error.message}`);
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};

// Function to add tags when creating/updating income or expense
const addTags = async (transactionId, transactionType, tags) => {
  try {
    if (!Array.isArray(tags)) {
      logger.warn("Tags provided are not in array format");
      return;
    }

    // Sanitize each tag to prevent XSS
    const sanitizedTags = tags.map(tag => xss(tag));

    logger.info(
      `Adding tags for transaction ${transactionId} of type ${transactionType}`
    );

    const tagDocuments = tags.map(tagName => ({
      name: tagName,
      transactionId,
      transactionType,
    }));

    await Tag.insertMany(tagDocuments);
    logger.info(`${tags.length} tags successfully added to the database`);
  } catch (error) {
    logger.error(
      `Error adding tags for transaction ${transactionId}: ${error.message}`
    );
  }
};

// Function to remove tags when a transaction is deleted
const removeTags = async transactionId => {
  try {
    logger.info(`Removing tags for transaction ${transactionId}`);

    const result = await Tag.deleteMany({ transactionId });

    if (result.deletedCount === 0) {
      logger.info(`No tags found for transaction ${transactionId}`);
    } else {
      logger.info(
        `${result.deletedCount} tags removed for transaction ${transactionId}`
      );
    }
  } catch (error) {
    logger.error(
      `Error removing tags for transaction ${transactionId}: ${error.message}`
    );
  }
};

export { getAllTags, addTags, removeTags };
