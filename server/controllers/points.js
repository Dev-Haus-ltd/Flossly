import {
  EmailVerification,
  LoyaltyPoint,
  Organisation,
  RewardPoint,
  User,
  UserLoyaltyPoint,
  UserOrganisation,
  UserPoint,
  UserPointsHistory,
  UserPreference,
} from "../models";
import DB from "../utils/db";
import { sendFeedBack } from "../utils/emailNotifications";
import bcrypt from "bcrypt";
import { parseJsonBody } from "../utils/body";
export const getPointHistory = async (event) => {
  try {
    const { userId } = event.context.user;
    const history = await UserPointsHistory.findAll({
      where: { userId },
      include: [{ model: RewardPoint, as: "rewardPoint" }],
      limit: 100,
      order: [["createdAt", "DESC"]],
    });
    return success(history);
  } catch (err) {
    return error(500, err.message);
  }
};

export const getLoyaltyPoints = async (event) => {
  try {
    const list = await LoyaltyPoint.findAll();
    return success(list);
  } catch (err) {
    return error(500, err.message);
  }
};

export const getRedeemedPoints = async (event) => {
  try {
    const { userId } = event.context.user;

    const userPoints = await UserLoyaltyPoint.findAll({
      where: { userId },
      include: [{ model: LoyaltyPoint, as: "loyaltyPoint" }],
    });
    return success(userPoints);
  } catch (err) {
    return error(500, err.message);
  }
};

export const getRewardPonits = async (event) => {
  try {
    const list = await RewardPoint.findAll();
    return success(list);
  } catch (err) {
    return error(500, err.message);
  }
};

export const redeemLoyaltyPoints = async (event) => {
  try {
    const { userId } = event.context.user;
    const body = await readBody(event);
    const { loyaltyPointId, deliveryDetails } = parseJsonBody(body);

    if (!deliveryDetails || !loyaltyPointId) {
      throw createError({
        message: "Loyalty Point ID and Delivery Details are required.",
      });
    }
    const reward = await LoyaltyPoint.findByPk(loyaltyPointId);
    if (!reward) {
      throw createError({ message: "Invalid Loyalty" });
    }
    const userPoints = await UserPoint.findOne({ where: { userId } });
    if (!userPoints) {
      throw createError({ message: "User Point not found" });
    }
    if (userPoints.balance < reward.points) {
      throw createError({
        message: "Insufficient points to redeem this reward.",
      });
    }

    userPoints.balance -= reward.points;
    userPoints.redeemed = (userPoints.redeemed || 0) + reward.points;
    await userPoints.save();

    await UserLoyaltyPoint.create({
      userId,
      loyaltyPointId,
      status: "pending",
      deliveryDetails,
    });

    return success("Reward redeemed successfully.");
  } catch (err) {
    return error(500, err.message);
  }
};

export const addRewardPonits = async (event) => {
  const body = await readBody(event);
  const { name, description, type, points } = body;
  try {
    await RewardPoint.create({ name, description, type, points });
    return success("Point Added");
  } catch (err) {
    return error(500, err.message);
  }
};

export const referPractice = async (event) => {
  const { userId } = event.context.user;
  const body = await readBody(event);
  const { practiceName, managerName, managerEmail, address, contact } =
    parseJsonBody(body);
  
  // Trim and validate managerName
  const trimmedManagerName = managerName ? managerName.trim() : '';
  if (!practiceName || !managerEmail || !trimmedManagerName) {
    throw createError({
      message: "practice name, manager name and manager email required",
    });
  }
  
  // Additional validation for managerName
  if (trimmedManagerName.length === 0) {
    throw createError({
      message: "Manager name cannot be empty or contain only spaces",
    });
  }

  const transaction = await DB.transaction();
  try {
    /** -------------------------
     * 1. Create Organisation (Invited)
     --------------------------*/
    const organisationPayload = {
      name: practiceName,
      status: "Invited",
      address,
      contact,
      referedBy: userId,
      hasUsedTrial: false,
    };

    let org = await Organisation.findOne({ where: { name: practiceName } });
    if (org) {
      throw createError({ message: "Organisation is already onboarded" });
    }

    org = await Organisation.create(organisationPayload, { transaction });

    /** -------------------------
     * 2. Create Manager User
     --------------------------*/
    let user = await User.findOne({ where: { email: managerEmail } });
    if (user) {
      throw createError({ message: "User already exists" });
    }

    const password = managerEmail.split("@")[0];
    const hashed = await bcrypt.hash(password, 10);

    user = await User.create(
      {
        fullName: trimmedManagerName,
        email: managerEmail,
        password: hashed,
        profileCompletion: 0,
        roleId: 8,
      },
      { transaction }
    );

    /** -------------------------
     * 3. Trial License (PER ORG)
     --------------------------*/
    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + 15);

    await UserPreference.create(
      {
        userId: user.id,
        organisationId: org.id,
        licenseType: "Trial",
        licenseRenewalDate: trialEndDate,
      },
      { transaction }
    );

    // 🔐 mark trial as used
    await org.update(
      { hasUsedTrial: true },
      { transaction }
    );

    /** -------------------------
     * 4. Associate User ↔ Organisation
     --------------------------*/
    await UserOrganisation.create(
      {
        userId: user.id,
        organisationId: org.id,
        status: "Invited",
      },
      { transaction }
    );

    /** -------------------------
     * 5. Email Verification
     --------------------------*/
    const link = generateVerificationLink();
    await EmailVerification.create(
      { email: managerEmail, link, userId: user.id },
      { transaction }
    );

    await sendEmailVerificationEmail({
      email: managerEmail,
      fullName: trimmedManagerName,
      link,
    });

    await transaction.commit();
    return success("Email sent");
  } catch (err) {
    if (!transaction.finished) {
      await transaction.rollback();
    }
    console.error("Refer Practice Error:", err);
    return error(500, "Failed to refer practice");
  }
};

export const feedBack = async (event) => {
  const { userId } = event.context.user;
  const body = await readBody(event);
  const { name, email, message } = parseJsonBody(body);
  if (!message || !email || !name) {
    throw createError({ message: "Your message is required" });
  }
  try {
    await sendFeedBack({
      email,
      name,
      message,
    });
    await UserPointsHistory.create({
      userId,
      rewardPointId: 3,
      points: 50,
      description: message,
    });
    const userPoints = await UserPoint.findOne({ where: { userId } });
    if (!userPoints) {
      await UserPoint.create({
        userId,
        balance: 50,
        totalPointsRewarded: 50,
        redeemed: 0,
      });
    }
    if (userPoints) {
      userPoints.balance += 50;
      userPoints.totalPointsRewarded += 50;
      await userPoints.save();
    }
    return success("Feedback submitted");
  } catch (err) {
    return error(500, err.message);
  }
};
