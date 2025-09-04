import { Rota, RotaShift, RotaUser } from "../models";

export const addRota = async (event) => {
  try {
    const body = await readBody(event);
    const { name, startDate, endDate, duration, notes,orgId } = JSON.parse(body);
    if (new Date(endDate) < new Date(startDate)) {
      return error("End date cannot be before start date");
    }
    const rota = await Rota.create({
      organisationId: orgId,
      name,
      startDate,
      endDate,
      duration,
      notes,
    });
    return success(rota);
  } catch (err) {
    return error(500, err.message);
  }
};

export const getRotas = async (event) => {
  const { orgId } = event.context.user;
  try {
    const rotas = await Rota.findAll({
      where: { organisationId: orgId },
      order: [["createdAt", "DESC"]],
    });
    return success(rotas);
  } catch (err) {
    return error(500, err.message);
  }
};

export const updateRota = async (event) => {
  try {
    const body = await readBody(event);
    const { id, name, startDate, endDate, duration, notes } = body;
    if (endDate && startDate && new Date(endDate) < new Date(startDate)) {
      return error("End date cannot be before start date");
    }
    const rota = await Rota.findByPk(id);
    if (!rota) throw createError({ message: "Rota not found " });
    await rota.update({ name, startDate, endDate, duration, notes });
    return success(rota);
  } catch (err) {
    return error(err.message);
  }
};

export const publishRota = async (event) => {
  const body = await readBody(event);
  const { id } = JSON.parse(body);
  try {
    const rota = await Rota.findByPk(id);
    if (!rota) throw createError({ message: "Rota not found " });
    await rota.update({
      isPublished: true,
      publishedDate: new Date(),
    });
    return success(rota);
  } catch (err) {
    return error(500, err.message);
  }
};

export const unPublishRota = async (event) => {
  const body = await readBody(event);
  const { id } = JSON.parse(body);
  try {
    const rota = await Rota.findByPk(id);
    if (!rota) throw createError({ message: "Rota not found " });
    await rota.update({
      isPublished: false,
    });

    return success(rota);
  } catch (err) {
    return error(500, err.message);
  }
};

export const removeRotaUser = async (event) => {
  const body = await readBody(event);
  const { id } = JSON.parse(body);
  try {
    const rotaUser = await RotaUser.findByPk(id);
    if (!rotaUser) throw createError({ message: "Rota user not found " });
    await rotaUser.destroy();
    return success("User removed from rota");
  } catch (err) {
    return error(500, err.message);
  }
};

export const addRotaUsers = async (event) => {
  try {
    const body = await readBody(event);
    const { rotaId, users } = JSON.parse(body);
    if (!rotaId) throw createError({ message: "Rota id required " });
    if (!Array.isArray(users) || users.length === 0) {
      throw createError({ message: "users required" });
    }
    const addedUsers = [];
    const skippedUsers = [];
    for (const user of users) {
      const { userId, isTempUser, tempUserName, tempUserRoleId } = user;
      let exists = null;
      if (userId) {
        exists = await RotaUser.findOne({
          where: { rotaId, userId },
        });
      } else if (isTempUser && tempUserName && tempUserRoleId) {
        exists = await RotaUser.findOne({
          where: { rotaId, tempUserName, tempUserRoleId },
        });
      }
      if (exists) {
        skippedUsers.push(user);
        continue;
      }
      const rotaUser = await RotaUser.create({
        rotaId,
        userId: userId || null,
        isTempUser: isTempUser || false,
        tempUserName: tempUserName || null,
        tempUserRoleId: tempUserRoleId || null,
      });
      addedUsers.push(rotaUser);
    }
    return success({
      added: addedUsers,
      skipped: skippedUsers,
    });
  } catch (err) {
    return error(500, err.message);
  }
};

export const addRotaShift = async (event) => {
  try {
    const body = await readBody(event);
    const {
      rotaId,
      dentistId,
      nurseId,
      userId,
      surgeryId,
      label,
      color,
      startDate,
      endDate,
      breakTime,
      notes,
    } = JSON.parse(body) ;
    if (
      !rotaId ||
      !dentistId ||
      !nurseId ||
      !surgeryId ||
      !label ||
      !startDate ||
      !endDate
    ) {
      throw createError({ message: "required fields missing" });
    }
    const shift = await RotaShift.create({
      rotaId,
      dentistId,
      nurseId,
      userId,
      surgeryId,
      label,
      color,
      startDate,
      endDate,
      breakTime,
      notes,
    });
    return success(shift);
  } catch (err) {
    return error(500, err.message);
  }
};

export const updateShift = async (event) => {
  try {
    const body = await JSON.parse(readBody(event));
    const shift = await RotaShift.findByPk(body.id);
    if (!shift) throw createError({ message: "shift not found" });
    await shift.update(body);
    return success(shift);
  } catch (err) {
    return error(500, err.message);
  }
};

export const getAllShifts = async (event) => {
  try {
    const body = await readBody(event);
    const { rotaId } = JSON.parse(body);
    if (!rotaId) throw createError({ message: "rotaId not found" });
    const shifts = await RotaShift.findAll({
      where: { rotaId, isDeleted: false },
      order: [["startDate", "ASC"]],
    });
    return success(shifts);
  } catch (err) {
    return error(500, err.message);
  }
};

export const startShift = async (event) => {
  try {
    const body = await JSON.parse(readBody(event));
    const shift = await RotaShift.findByPk(body.id);
    if (!shift) throw createError({ message: "shift not found" });
    if (shift.startedAt)
      throw createError({ message: "shift already started" });
    shift.startedAt = new Date();
    await shift.save();
    return success(shift);
  } catch (err) {
    return error(500, err.message);
  }
};

export const completeShift = async (event) => {
  try {
    const body = await JSON.parse(readBody(event));
    const shift = await RotaShift.findByPk(body.id);
    if (!shift) throw createError({ message: "shift not found" });
    if (!shift.startedAt)
      throw createError({ message: "shift not started yet" });
    if (shift.completedAt)
      throw createError({ message: "shift already completed" });
    shift.completedAt = new Date();
    await shift.save();
    return success(shift);
  } catch (err) {
    return error(500, err.message);
  }
};
