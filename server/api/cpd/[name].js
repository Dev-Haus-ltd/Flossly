import {
    listCourses,
    startQuiz,
    submitQuiz,
    addCourse,
    myCourses
  } from "../../controllers/cpd.js";
  
  export default defineEventHandler(async (event) => {
    const name = getRouterParam(event, "name");
  
    try {
      switch (name) {
        case "listCourses":
          return await listCourses(event);
  
        case "startQuiz":
          return await startQuiz(event);
  
        case "submitQuiz":
          return await submitQuiz(event);
  
        case "addCourse":
          return await addCourse(event);

          case "mycourses":
            return await myCourses(event)
  
        case "ping":
          return { ok: true, ts: Date.now() };
  
        default:
          setResponseStatus(event, 404);
          return { code: 0, error: `Not found: ${name}` };
      }
    } catch (err) {
      console.error("[CPD API]", name, err);
      setResponseStatus(event, 500);
      return { code: 0, error: "Internal server error" };
    }
  });