import {
  Course,
  CourseQuestionaire,
  UserCourseHistory,
  User,
} from "../models/index.js";

export const listCourses = async (event) => {
  try {
    const query = getQuery(event);
    const { category, page = 1, limit = 10 } = query;

    const whereClause = {};
    if (category) {
      whereClause.category = category;
    }
    const offset = (page - 1) * limit;
    const courses = await Course.findAndCountAll({
      where: whereClause,
      attributes: [
        "id",
        "title",
        "category",
        "credit_hours",
        "mode",
        "is_verified",
        "thumbnail",
        "course_objectives",
        "course_outcome",
        "description",
        "provider_name",
        "provider_type",
        "createdAt",
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [["createdAt", "DESC"]],
    });

    return {
      success: true,
      data: {
        courses: courses.rows,
        pagination: {
          total: courses.count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(courses.count / limit),
        },
      },
    };
  } catch (error) {
    console.error("Error listing courses:", error);
    setResponseStatus(event, 500);
    return {
      success: false,
      error: "Failed to fetch courses",
    };
  }
};
export const startQuiz = async (event) => {
  try {
    const body = await readBody(event);
    const { courseId } = JSON.parse(body);
    const { userId } = event.context.user;
    if (!userId) {
      throw createError({ statusCode: 400, message: "UserId is required" });
    }
    if (!courseId) {
      throw createError({ message: "courseId is required" });
    }
    const course = await Course.findByPk(courseId);
    if (!course) {
      throw createError({ message: "couse not found" });
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
      throw createError({ message: "course already completed" });
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
    return error(500, err);
  }
};

// Submit Quiz API - POST /api/cpd/submitQuiz
export const submitQuiz = async (event) => {
  try {
    const body = await readBody(event);
    const { courseId, answers } = body;
    const userId = event.context.user?.id;

    if (!userId) {
      setResponseStatus(event, 401);
      return {
        success: false,
        error: "User not authenticated",
      };
    }

    if (!courseId || !answers) {
      setResponseStatus(event, 400);
      return {
        success: false,
        error: "Course ID and answers are required",
      };
    }

    // Get user course history
    const userHistory = await UserCourseHistory.findOne({
      where: {
        user_id: userId,
        courseId: courseId,
      },
      include: [
        {
          model: Course,
          as: "course",
        },
        {
          model: User,
          as: "user",
          attributes: ["id", "fullName", "email"],
        },
      ],
    });

    if (!userHistory) {
      setResponseStatus(event, 404);
      return {
        success: false,
        error: "Course history not found. Please start the quiz first.",
      };
    }

    if (userHistory.status === "Completed") {
      setResponseStatus(event, 400);
      return {
        success: false,
        error: "Quiz already submitted",
      };
    }

    // Get correct answers
    const questionnaire = await CourseQuestionaire.findOne({
      where: { courseId },
      attributes: ["correct_answers"],
    });

    if (!questionnaire) {
      setResponseStatus(event, 404);
      return {
        success: false,
        error: "Questionnaire not found",
      };
    }

    // Calculate score
    const correctAnswers = questionnaire.correct_answers;
    let correctCount = 0;
    const totalQuestions = Object.keys(correctAnswers).length;

    // Compare user answers with correct answers
    for (const [questionId, userAnswer] of Object.entries(answers)) {
      if (correctAnswers[questionId] === userAnswer) {
        correctCount++;
      }
    }

    const percentage = (correctCount / totalQuestions) * 100;
    const passed = percentage >= 70; // 70% passing threshold

    // Update user course history
    await userHistory.update({
      status: passed ? "Completed" : "Failed",
      completed_date: new Date(),
      total_score: totalQuestions,
      obtained_score: correctCount,
    });

    // Generate certificate if passed
    let certificate = null;
    if (passed) {
      certificate = {
        id: `CERT-${userHistory.id}-${Date.now()}`,
        user_name: userHistory.user.fullName,
        course_title: userHistory.course.title,
        provider_name: userHistory.course.provider_name,
        completion_date: userHistory.completed_date,
        score: `${correctCount}/${totalQuestions}`,
        percentage: Math.round(percentage),
        credit_hours: userHistory.course.credit_hours,
      };
    }

    return {
      success: true,
      data: {
        result: {
          status: userHistory.status,
          score: `${correctCount}/${totalQuestions}`,
          percentage: Math.round(percentage),
          passed: passed,
          completed_date: userHistory.completed_date,
        },
        course: {
          id: userHistory.course.id,
          title: userHistory.course.title,
          category: userHistory.course.category,
          credit_hours: userHistory.course.credit_hours,
          provider_name: userHistory.course.provider_name,
          provider_type: userHistory.course.provider_type,
        },
        certificate: certificate,
      },
    };
  } catch (error) {
    console.error("Error submitting quiz:", error);
    setResponseStatus(event, 500);
    return {
      success: false,
      error: "Failed to submit quiz",
    };
  }
};
