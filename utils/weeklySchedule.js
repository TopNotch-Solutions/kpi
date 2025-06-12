const { User } = require("../models");
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

  const allWeekDates = getNextWeekDates();
  const todayDateStr = new Date().toISOString().split("T")[0];
  const upcomingDates = allWeekDates.filter(dateStr => dateStr >= todayDateStr);

  const shuffled = marshalls.sort(() => 0.5 - Math.random());
  const mid = Math.ceil(shuffled.length / 2);
  const classAMarshalls = shuffled.slice(0, mid);
  const classBMarshalls = shuffled.slice(mid);

  const shifts = [];

  let previousDayAssignments = new Map();

  function assignMarshallsToStreets({ date, shiftType, group }) {
    const marshallAssignedToday = new Set();
    const sortedStreets = [...activeStreets].sort(() => 0.5 - Math.random());

    for (const street of sortedStreets) {
      const requiredCount =
        shiftType === "Morning" ? street.morningShift : street.afternoonShift;

      let assignedCount = 0;

      const shuffledGroup = group.sort(() => 0.5 - Math.random());

      for (const { id: marshallId } of shuffledGroup) {
        if (assignedCount >= requiredCount) break;
        if (marshallAssignedToday.has(marshallId)) continue;

        const streetsWorkedYesterday = previousDayAssignments.get(marshallId) || new Set();
        if (streetsWorkedYesterday.has(street.streetCode)) {
          continue;
        }

        shifts.push({
          marshallId,
          date,
          shiftType,
          streetCode: street.streetCode,
        });

        marshallAssignedToday.add(marshallId);
        assignedCount++;

        console.log(
          `✅ Assigned Marshall ${marshallId} to ${street.streetCode} on ${date} (${shiftType})`
        );
      }
    }
  }

  for (let i = 0; i < upcomingDates.length; i++) {
    const dateStr = upcomingDates[i];
    const date = new Date(dateStr).toISOString().split("T")[0];
    const isSaturday = new Date(dateStr).getDay() === 6;

    console.log(`\n📅 Scheduling for ${date} (${isSaturday ? "Saturday" : "Weekday"})`);

    let todaysAssignments = new Map();

    if (isSaturday) {
      assignMarshallsToStreets({ date, shiftType: "Morning", group: classAMarshalls });
    } else {
      assignMarshallsToStreets({ date, shiftType: "Morning", group: classAMarshalls });
      assignMarshallsToStreets({ date, shiftType: "Afternoon", group: classBMarshalls });
    }

    previousDayAssignments = new Map();
    for (const shift of shifts.filter(s => s.date === date)) {
      if (!previousDayAssignments.has(shift.marshallId)) {
        previousDayAssignments.set(shift.marshallId, new Set());
      }
      previousDayAssignments.get(shift.marshallId).add(shift.streetCode);
    }
  }

  console.log(`\n🎯 Total shifts generated: ${shifts.length}`);
  return shifts;
}

module.exports = { generateWeeklyScheduleData };