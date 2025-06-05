const Street = require("../models/street");
const getNextWeekDates = require("./getDate");

async function generateWeeklyScheduleData() {
  console.log("📋 Generating weekly schedule...");

  const activeStreets = await Street.findAll({
    where: { status: "Active" },
    attributes: ["streetCode"],
    raw: true,
  });

  const streetCodes = activeStreets.map(street => street.streetCode);
  console.log(`🛣️ Found ${streetCodes.length} active streets`);

  if (streetCodes.length === 0) {
    throw new Error("No active streets available");
  }

  const shifts = [];
  const allWeekDates = getNextWeekDates();
  console.log("📅 All week dates:", allWeekDates);

  const todayDateStr = new Date().toISOString().split("T")[0];
  const upcomingDates = allWeekDates.filter(dateStr => dateStr >= todayDateStr);
  console.log("📆 Upcoming dates for scheduling:", upcomingDates);

  const marshallShiftCount = {};
  marshalls.forEach(({ marshallId }) => {
    marshallShiftCount[marshallId] = 0;
  });

  for (const dateStr of upcomingDates) {
    const date = new Date(dateStr).toISOString().split("T")[0];
    const isSaturday = new Date(dateStr).getDay() === 6;
    console.log(`🗓️ Scheduling for ${date} (${isSaturday ? "Saturday" : "Weekday"})`);

    let shiftTypes = isSaturday ? ["Morning"] : ["Morning", "Afternoon"];
    shiftTypes = shiftTypes.sort(() => Math.random() - 0.5);
    console.log(`🕒 Shift types for ${date}:`, shiftTypes);

    const marshallAssignedToday = new Set();

    for (const shiftType of shiftTypes) {
      let availableStreetCodes = [...streetCodes].sort(() => Math.random() - 0.5);
      console.log(`🚧 Available streets for ${shiftType} shift:`, availableStreetCodes);

      const sortedMarshalls = [...marshalls]
        .filter(({ marshallId }) => !marshallAssignedToday.has(marshallId))
        .sort((a, b) => marshallShiftCount[a.marshallId] - marshallShiftCount[b.marshallId]);

      for (const { marshallId } of sortedMarshalls) {
        if (availableStreetCodes.length === 0) break;
        if (marshallAssignedToday.has(marshallId)) continue;

        const streetCode = availableStreetCodes.pop();

        console.log(`✅ Assigning Marshall ${marshallId} to ${streetCode} on ${date} (${shiftType})`);

        shifts.push({
          marshallId,
          supervisorId: null, // Or assign if needed
          date,
          shiftType,
          streetCode,
        });

        marshallShiftCount[marshallId]++;
        marshallAssignedToday.add(marshallId);
      }

      console.log(`📊 Shift assignment complete for ${shiftType} on ${date}`);
    }
  }

  console.log("🎯 All shifts generated:", shifts.length);
  return shifts;
}

module.exports = { generateWeeklyScheduleData };