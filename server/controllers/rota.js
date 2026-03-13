import { Role, Rota, RotaShift, RotaUser, User, UserOrganisation, Organisation } from "../models";
import { Op, fn, col } from "sequelize";
import DB from "../utils/db";
import { parseJsonBody } from "../utils/body";

export const addRota = async (event) => {
  try {
    const body = await readBody(event);
    const { name, startDate, endDate, duration, notes, orgId } =
      parseJsonBody(body);

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
    const { id, name, startDate, endDate, duration, notes } = parseJsonBody(body);
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
  const { id } = parseJsonBody(body);
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
  const { id } = parseJsonBody(body);
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
  const { id } = parseJsonBody(body);
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
    const { rotaId, users } = parseJsonBody(body);
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

const checkCrossOrgShiftConflicts = async (staffIds, startDate, endDate, excludeShiftId = null) => {
  const conflicts = [];
  
  if (!staffIds || staffIds.length === 0) return conflicts;

  const userOrgs = await UserOrganisation.findAll({
    where: {
      userId: { [Op.in]: staffIds.filter(Boolean) },
      status: 'Active'
    },
    attributes: ['organisationId', 'userId'],
    distinct: true
  });

  if (userOrgs.length === 0) return conflicts;

  const orgIds = [...new Set(userOrgs.map(uo => uo.organisationId).filter(Boolean))];
  
  const rotas = await Rota.findAll({
    where: {
      organisationId: { [Op.in]: orgIds },
      isDeleted: false
    },
    attributes: ['id', 'organisationId', 'name']
  });

  if (rotas.length === 0) return conflicts;

  const rotaIds = rotas.map(r => r.id);

  const conflictConditions = [];
  staffIds.forEach(staffId => {
    if (staffId) {
      conflictConditions.push(
        { userId: staffId },
        { dentistId: staffId },
        { nurseId: staffId }
      );
    }
  });

  if (conflictConditions.length === 0) return conflicts;

  const whereClause = {
    rotaId: { [Op.in]: rotaIds },
    isDeleted: false,
    [Op.or]: conflictConditions,
    [Op.and]: [
      {
        startDate: { [Op.lt]: endDate },
        endDate: { [Op.gt]: startDate }
      }
    ]
  };

  if (excludeShiftId) {
    whereClause.id = { [Op.ne]: excludeShiftId };
  }

  const conflictingShifts = await RotaShift.findAll({
    where: whereClause,
    include: [
      {
        model: Rota,
        as: 'rota',
        attributes: ['id', 'name', 'organisationId'],
        include: [
          {
            model: Organisation,
            as: 'organisation',
            attributes: ['id', 'name']
          }
        ]
      }
    ]
  });

  conflictingShifts.forEach(shift => {
    conflicts.push({
      shiftId: shift.id,
      label: shift.label,
      startDate: shift.startDate,
      endDate: shift.endDate,
      rotaName: shift.rota?.name,
      organisationName: shift.rota?.organisation?.name,
      organisationId: shift.rota?.organisationId
    });
  });

  return conflicts;
};

export const addRotaShift = async (event) => {
  try {
    const body = await readBody(event);
    let {
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
      forceCreate,
      isTemplate,
    } = parseJsonBody(body);
    if (!rotaId || !label || !startDate || !endDate) {
      throw createError({ message: "Required fields missing" });
    }

    const currentRota = await Rota.findByPk(rotaId);
    if (!currentRota) {
      throw createError({ message: "Rota not found" });
    }

    const hasUser = userId || locumUserId;
    const hasSurgery = surgeryId;
    
    if (!hasUser && !hasSurgery) {
      throw createError({ message: "User or surgery is required" });
    }


    if (isTemplate) {
      const normalizedLabel = label.trim().toLowerCase();
      
      const templateShifts = await RotaShift.findAll({
        where: {
          isTemplate: true,
          isDeleted: false
        },
        include: [{
          model: Rota,
          as: 'rota',
          where: { organisationId: currentRota.organisationId },
          attributes: ['organisationId']
        }],
        attributes: ['label']
      });

      
      const matchingTemplate = templateShifts.find(
        template => template.label.trim().toLowerCase() === normalizedLabel
      );

      if (matchingTemplate) {
        
        const allShiftsWithSameName = await RotaShift.findAll({
          where: {
            isDeleted: false
          },
          include: [{
            model: Rota,
            as: 'rota',
            where: { organisationId: currentRota.organisationId },
            attributes: ['organisationId']
          }],
          attributes: ['label']
        });

        
        let maxCopyNumber = 0;
        const baseLabelPattern = new RegExp(`^${normalizedLabel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(-copy( \\d+)?)?$`, 'i');
        
        allShiftsWithSameName.forEach(shift => {
          const shiftLabel = shift.label.trim().toLowerCase();
          const match = shiftLabel.match(baseLabelPattern);
          
          if (match) {
            if (shiftLabel === normalizedLabel) {
              maxCopyNumber = Math.max(maxCopyNumber, 0);
            } else if (shiftLabel === `${normalizedLabel}-copy`) {
              maxCopyNumber = Math.max(maxCopyNumber, 1);
            } else {
              const copyMatch = shiftLabel.match(/-copy (\d+)$/);
              if (copyMatch) {
                maxCopyNumber = Math.max(maxCopyNumber, parseInt(copyMatch[1]));
              }
            }
          }
        });

        
        if (maxCopyNumber === 0) {
          label = `${label.trim()}-copy`;
        } else {
          label = `${label.trim()}-copy ${maxCopyNumber + 1}`;
        }
      }
    }

    const staffIds = [userId, dentistId, nurseId, locumUserId].filter(Boolean);
    
    const crossOrgConflicts = await checkCrossOrgShiftConflicts(
      staffIds,
      new Date(startDate),
      new Date(endDate)
    );

    if (crossOrgConflicts.length > 0 && !forceCreate) {
      const conflictMessages = crossOrgConflicts.map(conflict => 
        `${conflict.label} at ${conflict.organisationName} (${new Date(conflict.startDate).toLocaleString()} - ${new Date(conflict.endDate).toLocaleString()})`
      ).join(', ');
      
      return {
        code: 0,
        success: true,
        data: null,
        warning: `Warning: This staff member has overlapping shifts in other organizations: ${conflictMessages}`,
        conflicts: crossOrgConflicts
      };
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
              startDate: { [Op.lt]: endDate },
              endDate: { [Op.gt]: startDate }
            }
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
      isTemplate: isTemplate || false,
    });

    return success(shift);
  } catch (err) {
    return error(500, err.message);
  }
};
export const deleteRotaShift = async (event) => {
  try {
    const body = await readBody(event);
    const { rotaId, shiftId } = parseJsonBody(body);

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
    return error(500, err.message);
  }
};

export const updateShift = async (event) => {
  try {
    const body = await readBody(event);
    const parsedBody = typeof body === 'string' ? parseJsonBody(body) : body;
    const { id, startDate, endDate, dentistId, nurseId, userId, locumUserId, forceCreate, label } = parsedBody;
    
    const shift = await RotaShift.findByPk(id, {
      include: [{ model: Rota, as: 'rota' }]
    });
    
    if (!shift) throw createError({ message: "shift not found" });

    const finalStartDate = startDate ? new Date(startDate) : shift.startDate;
    const finalEndDate = endDate ? new Date(endDate) : shift.endDate;
    const finalDentistId = dentistId !== undefined ? dentistId : shift.dentistId;
    const finalNurseId = nurseId !== undefined ? nurseId : shift.nurseId;
    const finalUserId = userId !== undefined ? userId : shift.userId;
    const finalLocumUserId = locumUserId !== undefined ? locumUserId : shift.locumUserId;

    const staffIds = [finalUserId, finalDentistId, finalNurseId, finalLocumUserId].filter(Boolean);
    
    const crossOrgConflicts = await checkCrossOrgShiftConflicts(
      staffIds,
      finalStartDate,
      finalEndDate,
      id
    );

    if (crossOrgConflicts.length > 0 && !forceCreate) {
      const conflictMessages = crossOrgConflicts.map(conflict => 
        `${conflict.label} at ${conflict.organisationName} (${new Date(conflict.startDate).toLocaleString()} - ${new Date(conflict.endDate).toLocaleString()})`
      ).join(', ');
      
      return {
        code: 0,
        success: true,
        data: null,
        warning: `Warning: This staff member has overlapping shifts in other organizations: ${conflictMessages}`,
        conflicts: crossOrgConflicts
      };
    }

    const conflictConditions = [];
    if (finalDentistId) conflictConditions.push({ dentistId: finalDentistId });
    if (finalNurseId) conflictConditions.push({ nurseId: finalNurseId });
    if (finalUserId) conflictConditions.push({ userId: finalUserId });

    if (conflictConditions.length > 0) {
      const conflictShift = await RotaShift.findOne({
        where: {
          rotaId: shift.rotaId,
          id: { [Op.ne]: id },
          [Op.or]: conflictConditions,
          [Op.and]: [
            {
              [Op.or]: [
                { startDate: { [Op.lt]: finalEndDate } },
                { endDate: { [Op.gt]: finalStartDate } }
              ]
            }
          ]
        }
      });

      if (conflictShift) {
        throw createError({
          statusCode: 400,
          message: "Shift conflict: another shift already exists in this time range",
        });
      }
    }

    await shift.update(parsedBody);

    return success(shift);
  } catch (err) {
    return error(500, err.message);
  }
};

export const getAllShifts = async (event) => {
  try {
    const body = await readBody(event);
    const { rotaId } = parseJsonBody(body);
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
    const { rotaId } = parseJsonBody(body);
    if (!rotaId) {
      throw createError({
        statusCode: 400,
        statusMessage: "rotaId is required",
      });
    }
    
    // Get the rota to find organisationId
    const rota = await Rota.findOne({ where: { id: rotaId } });
    if (!rota) {
      throw createError({
        statusCode: 404,
        statusMessage: "Rota not found",
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
            {
              model: UserOrganisation,
              as: "userOrganisations",
              where: { organisationId: rota.organisationId },
              required: false,
              attributes: ["status"],
            },
          ],
        },
        {
          model: Role,
          as: "role",
        },
      ],
    });
    
    // Map the data to include orgStatus on the user object
    const formattedRotaUsers = rotaUsers.map((rotaUser) => {
      const userData = rotaUser.toJSON();
      if (userData.user && userData.user.userOrganisations && userData.user.userOrganisations.length > 0) {
        userData.user.orgStatus = userData.user.userOrganisations[0].status || "Active";
      } else if (userData.user) {
        userData.user.orgStatus = "Active"; // Default to Active if no UserOrganisation found
      }
      // Remove userOrganisations from the response to keep it clean
      if (userData.user && userData.user.userOrganisations) {
        delete userData.user.userOrganisations;
      }
      return userData;
    });
    
    return success(formattedRotaUsers);
  } catch (err) {
    return error(500, err.message);
  }
};
