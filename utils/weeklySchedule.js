const { User } = require("../models");
const ScheduleMeta = require("../models/metaData");
const Street = require("../models/street");
const getNextWeekDates = require("./getDate");
const { Op } = require("sequelize");

async function generateWeeklyScheduleData() {
  console.log("📋 Generating weekly schedule...");

  const activeStreets = await Street.findAll({
    where: { status: "Active" },
    attributes: ["streetCode", "priority", "morningShift", "afternoonShift"],
    raw: true,
  });

  const marshalls = await User.findAll({
    where: { role: "Marshall" },
    attributes: ["id"],
    raw: true,
  });

  if (!activeStreets.length || !marshalls.length) {
    throw new Error("No active streets or marshalls found.");
  }

  // 🧠 Fetch and rotate week index from DB
  let meta = await ScheduleMeta.findOne();
  if (!meta) {
    meta = await ScheduleMeta.create({ weekIndex: 0 });
  }

  let weekIndex = meta.weekIndex;
  console.log(`🔁 Week Index (from DB): ${weekIndex}`);

  const allWeekDates = getNextWeekDates();
  const todayDateStr = new Date().toISOString().split("T")[0];
  const upcomingDates = allWeekDates.filter(dateStr => dateStr >= todayDateStr);

  const shuffled = marshalls.sort(() => 0.5 - Math.random());
  const mid = Math.ceil(shuffled.length / 2);
  const originalClassA = shuffled.slice(0, mid);
  const originalClassB = shuffled.slice(mid);

  // Swap roles based on week index
  const classAMarshalls = weekIndex % 2 === 0 ? originalClassA : originalClassB;
  const classBMarshalls = weekIndex % 2 === 0 ? originalClassB : originalClassA;

  const shifts = [];
  let previousDayAssignments = new Map();

  function assignMarshallsToStreets({ date, shiftType, group, fallbackGroup }) {
    const marshallAssignedToday = new Set();
    const sortedStreets = [...activeStreets].sort(() => 0.5 - Math.random());

    for (const street of sortedStreets) {
      const requiredCount =
        shiftType === "Morning" ? street.morningShift : street.afternoonShift;

      let assignedCount = 0;
      const primaryGroup = [...group.sort(() => 0.5 - Math.random())];
      const backupGroup = [...fallbackGroup.sort(() => 0.5 - Math.random())];

      const tryAssign = (candidateGroup) => {
        for (const { id: marshallId } of candidateGroup) {
          if (assignedCount >= requiredCount) break;
          if (marshallAssignedToday.has(marshallId)) continue;

          const streetsWorkedYesterday = previousDayAssignments.get(marshallId) || new Set();
          if (streetsWorkedYesterday.has(street.streetCode)) continue;

          shifts.push({
            marshallId,
            date,
            shiftType,
            streetCode: street.streetCode,
          });

          marshallAssignedToday.add(marshallId);
          assignedCount++;

          console.log(`✅ Assigned Marshall ${marshallId} to ${street.streetCode} on ${date} (${shiftType})`);
        }
      };

      // Try primary group first, then fallback group
      tryAssign(primaryGroup);
      if (assignedCount < requiredCount) {
        tryAssign(backupGroup);
      }

      if (assignedCount < requiredCount) {
        console.warn(`⚠️ Not enough marshalls to fully cover ${street.streetCode} on ${date} (${shiftType})`);
      }
    }
  }

  for (const dateStr of upcomingDates) {
    const date = new Date(dateStr).toISOString().split("T")[0];
    const isSaturday = new Date(dateStr).getDay() === 6;

    console.log(`\n📅 Scheduling for ${date} (${isSaturday ? "Saturday" : "Weekday"})`);

    if (isSaturday) {
      assignMarshallsToStreets({
        date,
        shiftType: "Morning",
        group: classAMarshalls,
        fallbackGroup: classBMarshalls,
      });
    } else {
      assignMarshallsToStreets({
        date,
        shiftType: "Morning",
        group: classAMarshalls,
        fallbackGroup: classBMarshalls,
      });

      assignMarshallsToStreets({
        date,
        shiftType: "Afternoon",
        group: classBMarshalls,
        fallbackGroup: classAMarshalls,
      });
    }

    // Update previous day assignments for next day logic
    previousDayAssignments = new Map();
    for (const shift of shifts.filter(s => s.date === date)) {
      if (!previousDayAssignments.has(shift.marshallId)) {
        previousDayAssignments.set(shift.marshallId, new Set());
      }
      previousDayAssignments.get(shift.marshallId).add(shift.streetCode);
    }
  }

  // 🔁 Rotate week index in DB
  meta.weekIndex = (weekIndex + 1) % 4;
  await meta.save();

  console.log(`\n🎯 Total shifts generated: ${shifts.length}`);
  console.log(`🔄 Week Index updated to: ${meta.weekIndex}`);
  return shifts;
}

module.exports = { generateWeeklyScheduleData };
