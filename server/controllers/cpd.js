import {
  Course,
  CourseQuestionaire,
  UserCourseHistory,
  User,
  Organisation,
  UserOrganisation,
} from "../models/index.js";
import { format } from "date-fns";
import { parseJsonBody } from "../utils/body";

export const listCourses = async (event) => {
  try {
    const courses = await Course.findAll({
      order: [["createdAt", "DESC"]],
    });

    const groupedByCategory = courses.reduce((acc, course) => {
      const coursePlain = course.get({ plain: true });
      const cat = coursePlain.category || "Uncategorized";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(coursePlain);
      return acc;
    }, {});

    return success(groupedByCategory);
  } catch (err) {
    return error(500, err);
  }
};

export const myCourses = async (event) => {};
export const startQuiz = async (event) => {
  try {
    const body = await readBody(event);
    const { courseId } = parseJsonBody(body);
    const { userId } = event.context.user;
    if (!userId) {
      throw createError({ statusCode: 400, message: "UserId is required" });
    }
    if (!courseId) {
      throw createError({ message: "courseId is required" });
    }
    const course = await Course.findByPk(courseId);
    if (!course) {
      throw createError({ message: "course not found" });
    }
    let userHistory = await UserCourseHistory.findOne({
      where: {
        userId,
        courseId,
      },
    });

    if (!userHistory) {
      userHistory = await UserCourseHistory.create({
        userId,
        courseId,
        status: "In Progress",
      });
    } else if (userHistory.status === "Completed") {
      const completedDate = new Date(userHistory.completedDate);
      const formattedDate = format(completedDate, 'dd/MM/yyyy');
      throw createError({
        message: `You have already completed this course on ${formattedDate}`,
      });
    }
    const questionnaire = await CourseQuestionaire.findAll({
      where: { courseId },
      attributes: [
        "id",
        "question",
        "optionA",
        "optionB",
        "optionC",
        "optionD",
      ], // Exclude correct_answers
    });

    if (!questionnaire.length) {
      throw createError({ message: "No questions found for this course" });
    }
    return success(questionnaire);
  } catch (err) {
    return error(500, err.message);
  }
};
// Submit Quiz API - POST /api/cpd/submitQuiz
export const submitQuiz = async (event) => {
  try {
    const body = await readBody(event);
    const { courseId, answers } =
      typeof body === "string" ? parseJsonBody(body) : body;
    const { userId } = event.context.user || {};

    if (!userId) {
      throw createError({ statusCode: 400, message: "UserId is required" });
    }
    if (!courseId) {
      throw createError({ message: "courseId is required" });
    }
    if (!answers || typeof answers !== "object") {
      throw createError({ message: "answers are required" });
    }

    // Make sure course exists
    const course = await Course.findByPk(courseId);
    if (!course) {
      throw createError({ message: "course not found" });
    }

    // Find user course history
    const userHistory = await UserCourseHistory.findOne({
      where: { userId, courseId },
      include: [
        { model: Course, as: "course" },
        { model: User, as: "user", attributes: ["id", "fullName", "email"] },
      ],
    });

    if (!userHistory) {
      throw createError({
        message: "Course history not found. Please start the quiz first.",
      });
    }
    if (userHistory.status === "Completed") {
      throw createError({ message: "Quiz already submitted" });
    }

    // Fetch all questions for the course
    const questions = await CourseQuestionaire.findAll({
      where: { courseId },
      attributes: ["id", "correctAnswer"],
      order: [["id", "ASC"]],
    });

    if (!questions.length) {
      throw createError({ message: "No questions found for this course" });
    }

    // Score calculation
    // Expected answers format: { [questionId]: "A" | "B" | "C" | "D" } OR the actual answer string matching correctAnswer
    // We will compare by string equality with correctAnswer.
    let correctCount = 0;
    for (const q of questions) {
      const userAnswer = answers[q.id];
      if (
        userAnswer &&
        String(userAnswer).trim() === String(q.correctAnswer).trim()
      ) {
        correctCount++;
      }
    }

    const totalQuestions = questions.length;
    const percentage = (correctCount / totalQuestions) * 100;
    const passed = percentage >= 50;

    // Update user course history
    await userHistory.update(
      {
        status: passed ? "Completed" : "Failed",
        completedDate: new Date(),
        totalScore: totalQuestions,
        obtainedScore: correctCount,
      },
      { where: { courseId } }
    );

    // Generate certificate if passed
    let certificate = null;
    if (passed) {
      certificate = {
        id: `CERT-${userHistory.id}-${Date.now()}`,
        user_name: userHistory.user.fullName,
        course_title: userHistory.course.title,
        completion_date: userHistory.completedDate,
        score: `${correctCount}/${totalQuestions}`,
        percentage: Math.round(percentage),
        credit_hours: userHistory.course.credit_hours,
      };
      
    // add reward points
    }

    return success({
      message: `Congratulations! You've completed the course with ${Math.round(
        percentage
      )}% score. You'll get the Certificate in 2 days.`,
      result: {
        status: userHistory.status,
        score: `${correctCount}/${totalQuestions}`,
        percentage: Math.round(percentage),
        passed,
        completed_date: userHistory.completedDate,
      },
      course: {
        id: userHistory.course.id,
        title: userHistory.course.title,
        category: userHistory.course.category,
        credit_hours: userHistory.course.credit_hours,
      },
      certificate,
    });
  } catch (err) {
    return error(500, err.message);
  }
};

export const addCourse = async (event) => {
  try {
    const body = await readBody(event);
    const payload = typeof body === "string" ? parseJsonBody(body) : body;

    const requiredTitle = payload.title;
    const requiredCategory = payload.category;

    if (!requiredTitle) {
      throw createError({ statusCode: 400, message: "title is required" });
    }
    if (!requiredCategory) {
      throw createError({ statusCode: 400, message: "category is required" });
    }

    const toNumber = (v) =>
      v === undefined || v === null || v === "" ? undefined : Number(v);

    const normalized = {
      title: requiredTitle,
      category: requiredCategory,
      creditHours: toNumber(payload.creditHours),
      mode: payload.mode,
      isVerified: payload.isVerified,
      thumbnail: payload.thumbnail,
      objectives: payload.objectives,
      outcome: payload.outcome,
      aim: payload.aim,
      link: payload.link,
      description: payload.description,
      metaData: payload.metaData || {},
    };

    if (normalized.creditHours === undefined) delete normalized.creditHours;
    if (normalized.isVerified === undefined) delete normalized.isVerified;

    // Create course
    const course = await Course.create(normalized);

    // Optionally create questionnaire
    const questions = payload.questions;
    if (Array.isArray(questions) && questions.length) {
      const rows = questions.map((q) => ({
        courseId: course.id,
        question: q.question,
        correctAnswer: q.correctAnswer,
        optionA: q.optionA,
        optionB: q.optionB,
        optionC: q.optionC,
        optionD: q.optionD,
      }));
      await CourseQuestionaire.bulkCreate(rows);
    }

    return success({ id: course.id });
  } catch (err) {
    return error(500, err.message);
  }
};

// Get user course history API
export const getUserCourseHistory = async (event) => {
  try {
    const { userId } = event.context.user;
    const query = getQuery(event);
    const targetUserId = query.userId || userId; // Allow managers to view other users' history

    if (!targetUserId) {
      throw createError({ statusCode: 400, message: "UserId is required" });
    }

    // Check if user is requesting their own history or if they're a manager
    const loggedUser = event.context.user;
    if (targetUserId !== userId) {
      // Check if the logged user is a manager of the target user's organization
      const targetUser = await User.findByPk(targetUserId, {
        include: [
          {
            model: UserOrganisation,
            as: "userOrganisations",
            include: [
              {
                model: Organisation,
                as: "organisation",
                where: { managerId: loggedUser.userId },
              },
            ],
          },
        ],
      });

      if (!targetUser || !targetUser.userOrganisations.length) {
        throw createError({
          statusCode: 403,
          message:
            "Access denied. You can only view your own course history or manage your team members.",
        });
      }
    }

    const courseHistory = await UserCourseHistory.findAll({
      where: { userId: targetUserId },
      include: [
        {
          model: Course,
          as: "course",
          attributes: [
            "id",
            "title",
            "category",
            "creditHours",
            "mode",
            "isVerified",
            "thumbnail",
            "objectives",
            "aim",
            "outcome",
            "description",
          ],
        },
        {
          model: User,
          as: "user",
          attributes: ["id", "fullName", "email"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    // Calculate summary statistics
    const totalCourses = courseHistory.length;
    const completedCourses = courseHistory.filter(
      (h) => h.status === "Completed"
    ).length;
    const inProgressCourses = courseHistory.filter(
      (h) => h.status === "In Progress"
    ).length;
    const failedCourses = courseHistory.filter(
      (h) => h.status === "Failed"
    ).length;
    const totalCredits = courseHistory
      .filter((h) => h.status === "Completed")
      .reduce((sum, h) => sum + parseInt(h.course.creditHours, 10), 0);

    return success({
      courseHistory,
      summary: {
        totalCourses,
        completedCourses,
        inProgressCourses,
        failedCourses,
        totalCredits,
      },
    });
  } catch (err) {
    return error(500, err.message);
  }
};

export const assignCourseToUsers = async (event) => {
  try {
    const body = await readBody(event);
    const { userIds, courseId } =
      typeof body === "string" ? parseJsonBody(body) : body;
    const { userId: managerId, orgId } = event.context.user;
    if (!Array.isArray(userIds) || userIds.length === 0) {
      throw createError({
        statusCode: 400,
        message: "userIds (array) is required",
      });
    }
    if (!courseId) {
      throw createError({ statusCode: 400, message: "courseId is required" });
    }
    // Check if the logged user is a manager
    const organisation = await Organisation.findOne({
      where: { id: orgId, managerId },
    });
    if (!organisation) {
      throw createError({
        statusCode: 403,
        message:
          "Access denied. Only managers can assign courses to team members.",
      });
    }
    // Check if course exists
    const course = await Course.findByPk(courseId);
    if (!course) {
      throw createError({ statusCode: 404, message: "Course not found" });
    }
    const results = {
      assigned: [],
      skipped: [],
    };
    for (const uid of userIds) {
      // Check if the target user belongs to the same organization
      const userOrganisation = await UserOrganisation.findOne({
        where: { userId: uid, organisationId: orgId },
      });
      if (!userOrganisation) {
        results.skipped.push({
          userId: uid,
          reason: "User not in organisation",
        });
        continue;
      }
      // Check if course already assigned
      const existingAssignment = await UserCourseHistory.findOne({
        where: { userId: uid, courseId },
      });

      if (existingAssignment) {
        results.skipped.push({ userId: uid, reason: "Already assigned" });
        continue;
      }
      // Assign course
      const courseAssignment = await UserCourseHistory.create({
        userId: uid,
        courseId,
        status: "In Progress",
      });
      results.assigned.push(courseAssignment);
    }

    return success({
      message: "Course assignment process completed",
      ...results,
    });
  } catch (err) {
    return error(500, err.message);
  }
};
