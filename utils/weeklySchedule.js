const { User } = require("../models");
const Street = require("../models/street");
const getNextWeekDates = require("./getDate");
const { Op } = require("sequelize");

async function generateWeeklyScheduleData() {
  console.log("📋 Generating weekly schedule...");

  // Fetch active streets with shift needs and priority
  const activeStreets = await Street.findAll({
    where: { status: "Active" },
    attributes: ["streetCode", "priority", "morningShift", "afternoonShift"],
    raw: true,
  });

  // Fetch all marshalls
  const marshalls = await User.findAll({
    where: { role: "Marshall" },
    attributes: ["id"],
    raw: true,
  });
  console.log("All marshalls: ",marshalls)
  if (!activeStreets.length || !marshalls.length) {
    throw new Error("No active streets or no marshalls found.");
  }

  const marshallShiftCount = {};
  marshalls.forEach(({ id }) => {
    marshallShiftCount[id] = 0;
  });
  console.log("Marshall shift count: ",marshallShiftCount)
  const allWeekDates = getNextWeekDates();
  const todayDateStr = new Date().toISOString().split("T")[0];
  const upcomingDates = allWeekDates.filter(dateStr => dateStr >= todayDateStr);

  const shifts = [];

  for (const dateStr of upcomingDates) {
    const date = new Date(dateStr).toISOString().split("T")[0];
    const isSaturday = new Date(dateStr).getDay() === 6;
    const shiftTypes = isSaturday ? ["Morning"] : ["Morning", "Afternoon"];
    const marshallAssignedToday = new Set();

    console.log(`\n📅 Scheduling for ${date} (${isSaturday ? "Saturday" : "Weekday"})`);

    for (const shiftType of shiftTypes.sort(() => Math.random() - 0.5)) {
      // Sort streets by priority (1 = highest)
      const sortedStreets = [...activeStreets].sort((a, b) => a.priority - b.priority);

      for (const street of sortedStreets) {
        const requiredCount =
          shiftType === "Morning" ? street.morningShift : street.afternoonShift;

        let assignedCount = 0;

        // Prepare marshall list: available today, sorted by fewest shifts
        const availableMarshalls = marshalls
          .filter(({ id }) => !marshallAssignedToday.has(id))
          .sort((a, b) => marshallShiftCount[a.id] - marshallShiftCount[b.id]);

        for (const { id: marshallId } of availableMarshalls) {
          if (assignedCount >= requiredCount) break;

          shifts.push({
            marshallId,
            date,
            shiftType,
            streetCode: street.streetCode,
          });

          marshallShiftCount[marshallId]++;
          marshallAssignedToday.add(marshallId);
          assignedCount++;

          console.log(
            `✅ Assigned Marshall ${marshallId} to ${street.streetCode} on ${date} (${shiftType})`
          );
        }
      }

      console.log(`📊 Completed ${shiftType} shift for ${date}`);
    }
  }

  console.log(`\n🎯 Total shifts generated: ${shifts.length}`);
  return shifts;
}

module.exports = { generateWeeklyScheduleData };