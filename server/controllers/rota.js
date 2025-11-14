import { Role, Rota, RotaShift, RotaUser, User } from "../models";
import { Op, fn, col } from "sequelize";
import DB from "../utils/db";

export const addRota = async (event) => {
  try {
    const body = await readBody(event);
    const { name, startDate, endDate, duration, notes, orgId } =
      JSON.parse(body);

    if (!orgId || !name || !startDate || !endDate) {
      return error("Required fields missing");
    }

    if (new Date(endDate) < new Date(startDate)) {
      return error("End date cannot be before start date");
    }
    const conflictRota = await Rota.findOne({
      where: {
        organisationId: orgId,
        isPublished: true,
        [Op.or]: [
          { startDate: { [Op.between]: [startDate, endDate] } },
          { endDate: { [Op.between]: [startDate, endDate] } },
          {
            [Op.and]: [
              { startDate: { [Op.lte]: startDate } },
              { endDate: { [Op.gte]: endDate } },
            ],
          },
        ],
      },
    });

    if (conflictRota) {
      throw createError({
        message:
          "A rota already exists for this organisation in the given date range",
      });
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
      attributes: {
        include: [[fn("COUNT", col("users.id")), "userCount"]],
      },
      include: [
        {
          model: RotaUser,
          as: "users",
          attributes: [],
        },
      ],
      group: ["Rota.id"],
      order: [["createdAt", "DESC"]],
    });

    return success(rotas);
  } catch (err) {
    return error(500, err.message);
  }
};

export const getUserRotas = async (event) => {
  const { userId } = event.context.user;
  try {
    if (!userId) throw createError({ message: "UserID required" });
    const rotas = await Rota.findAll({
      include: [
        {
          model: RotaUser,
          as: "users",
          required: true,
          where: { userId },
          include: [
            {
              model: User,
              as: "user",
              attributes: ["id", "fullName", "email", "photo"],
            },
          ],
        },
      ],
      order: [["startDate", "ASC"]],
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
    const users = await RotaUser.findAll({ where: { rotaId: id } });
    await Promise.all(
      users.map(async (el) => {
        const user = await User.findOne({ where: { id: el.userId } });
        await newRotaAvailableNotification({
          startDate: new Date(rota.startDate),
          fullName: user.fullName,
          email: user.email,
          name: rota.name
        });
      })
    );
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
  const transaction = await DB.transaction();
  try {
    const body = await readBody(event);
    const { rotaId, users } = JSON.parse(body);
    if (!rotaId) throw createError({ message: "Rota id required" });
    if (!Array.isArray(users) || users.length === 0) {
      throw createError({ message: "users required" });
    }
    await RotaUser.destroy({ where: { rotaId, isTempUser: false }, transaction });
    const addedUsers = await Promise.all(
      users.map((user) => {
        const { userId, isTempUser, tempUserName, tempUserRoleId } = user;
        return RotaUser.create(
          {
            rotaId,
            userId: userId || null,
            isTempUser: isTempUser || false,
            tempUserName: tempUserName || null,
            tempUserRoleId: tempUserRoleId || null,
          },
          { transaction }
        );
      })
    );
    await transaction.commit();
    return success({ added: addedUsers });
  } catch (err) {
    await transaction.rollback();
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
      isLocumShift,
      locumUserId,
      notes,
    } = JSON.parse(body);

    if (!rotaId || (!userId && !locumUserId) || !label || !startDate || !endDate) {
      throw createError({ message: "Required fields missing" });
    }

    const conflictConditions = [];

    if (surgeryId) {
      conflictConditions.push({ surgeryId });
    }
    if (dentistId) {
      conflictConditions.push({ dentistId });
    }
    if (nurseId) {
      conflictConditions.push({ nurseId });
    }

    if (conflictConditions.length > 0) {
      const conflictShift = await RotaShift.findOne({
        where: {
          rotaId,
          [Op.or]: conflictConditions,
          [Op.and]: [
            {
              [Op.or]: [
                {
                  startDate: { [Op.between]: [startDate, endDate] },
                },
                {
                  endDate: { [Op.between]: [startDate, endDate] },
                },
                {
                  [Op.and]: [
                    { startDate: { [Op.lte]: startDate } },
                    { endDate: { [Op.gte]: endDate } },
                  ],
                },
              ],
            },
          ],
        },
      });

      if (conflictShift) {
        throw createError({
          statusCode: 400,
          message:
            "Shift conflict: another shift already exists in this time range",
        });
      }
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
      isLocumShift,
      locumUserId,
      notes,
    });
    return success(shift);
  } catch (err) {
    console.error(err);
    return error(500, err.message);
  }
};
export const deleteRotaShift = async (event) => {
  try {
    const body = await readBody(event);
    const { rotaId, shiftId } = JSON.parse(body);

    if (!rotaId || !shiftId)
      throw createError({ message: "rotaId and shiftId are required" });

    // Find the shift belonging to the rota
    const shift = await RotaShift.findOne({
      where: { id: shiftId, rotaId, isDeleted: false },
    });

    if (!shift)
      throw createError({ message: "Shift not found in the specified rota" });

    // Soft delete
    shift.isDeleted = true;
    await shift.save();

    return success({ message: "Shift deleted from rota successfully" });
  } catch (err) {
    console.log(err);
    return error(500, err.message);
  }
};

export const updateShift = async (event) => {
  try {
    const body = await readBody(event);
    const { id } = JSON.parse(body);
    const shift = await RotaShift.findByPk(id);
    if (!shift) throw createError({ message: "shift not found" });
    await shift.update(JSON.parse(body));
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

export const getRotaUsers = async (event) => {
  try {
    const body = await readBody(event);
    const { rotaId } = JSON.parse(body);
    if (!rotaId) {
      throw createError({
        statusCode: 400,
        statusMessage: "rotaId is required",
      });
    }
    const rotaUsers = await RotaUser.findAll({
      where: { rotaId },
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "fullName", "email", "roleId", "photo"],
          required: false,
          include: [
            {
              model: Role,
              as: "role",
            },
          ],
        },
        {
          model: Role,
          as: "role",
        },
      ],
    });
    return success(rotaUsers);
  } catch (err) {
    return error(500, err.message);
  }
};
