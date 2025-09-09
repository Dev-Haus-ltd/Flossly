import {
    // Frameworks
    createFramework,
    listFrameworks,
    updateFramework,
    deleteFramework,
  
    // Requirements
    createRequirement,
    listRequirements,
    updateRequirement,
    deleteRequirement,
  
    // Providers
    createProvider,
    listProviders,
    updateProvider,
    deleteProvider,
  
    // Courses
    createCourse,
    listCourses,
    updateCourse,
    deleteCourse,
  
    // Sessions
    createSession,
    listSessions,
    updateSession,
    deleteSession,
  
    // Enrollments
    enroll,
    approveEnrollment,
    markAttended,
    cancelEnrollment,
    listEnrollments,
  
    // External activities (self-reported)
    claimActivity,
    approveActivity,
    rejectActivity,
    deleteActivity,
    listActivities,
  
    // Credits & progress
    awardCredit,
    listCredits,
    getProgress,
  
    // Certifications
    createCertification,
    listCertifications,
    updateCertification,
    deleteCertification,
  } from "../../controllers/cpd.js";
  
  export default defineEventHandler(async (event) => {
    const name = getRouterParam(event, "name");
    
  
    try {
      switch (name) {
        /** ------------------ Frameworks ------------------ */
        case "createFramework":
          
          return await createFramework(event);
  
        case "listFrameworks":
          
          return await listFrameworks(event);
  
        case "updateFramework":
          
          return await updateFramework(event);
  
        case "deleteFramework":
          
          return await deleteFramework(event);
  
        /** ------------------ Requirements ------------------ */
        case "createRequirement":
          
          return await createRequirement(event);
  
        case "listRequirements":
          
          return await listRequirements(event);
  
        case "updateRequirement":
          
          return await updateRequirement(event);
  
        case "deleteRequirement":
          
          return await deleteRequirement(event);
  
        /** ------------------ Providers ------------------ */
        case "createProvider":
          
          return await createProvider(event);
  
        case "listProviders":
         
          return await listProviders(event);
  
        case "updateProvider":
          
          return await updateProvider(event);
  
        case "deleteProvider":
          
          return await deleteProvider(event);
  
        /** ------------------ Courses ------------------ */
        case "createCourse":
          
          return await createCourse(event);
  
        case "listCourses":
          
          return await listCourses(event);
  
        case "updateCourse":
          
          return await updateCourse(event);
  
        case "deleteCourse":
          
          return await deleteCourse(event);
  
        /** ------------------ Sessions ------------------ */
        case "createSession":
          
          return await createSession(event);
  
        case "listSessions":
          
          return await listSessions(event);
  
        case "updateSession":
          
          return await updateSession(event);
  
        case "deleteSession":
          
          return await deleteSession(event);
  
        /** ------------------ Enrollments ------------------ */
        case "enroll":
          
          return await enroll(event);
  
        case "approveEnrollment":
          
          return await approveEnrollment(event);
  
        case "markAttended":
          
          return await markAttended(event);
  
        case "cancelEnrollment":
          
          return await cancelEnrollment(event);
  
        case "listEnrollments":
          
          return await listEnrollments(event);
  
        /** ------------------ External Activities ------------------ */
        case "claimActivity":         
          return await claimActivity(event);
        case "approveActivity":       
          return await approveActivity(event);  
        case "rejectActivity":
          return await rejectActivity(event); 
        case "deleteActivity":
          return await deleteActivity(event); 
        case "listActivities":
          return await listActivities(event);
  
        /** ------------------ Credits & Progress ------------------ */
        case "awardCredit":
          return await awardCredit(event);
  
        case "listCredits":
          return await listCredits(event);
  
        case "getProgress":
          return await getProgress(event);
  
        /** ------------------ Certifications ------------------ */
        case "createCertification":
          return await createCertification(event);
  
        case "listCertifications":
          return await listCertifications(event);
  
        case "updateCertification":
          return await updateCertification(event);
  
        case "deleteCertification":
          
          return await deleteCertification(event);
  
        /** ------------------ Healthcheck / default ------------------ */
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
  
  
  