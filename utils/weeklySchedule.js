const Relationship = require("../models/relationship");
const Street = require("../models/street");
const { default: getNextWeekDates } = require("./getDate");

async function generateWeeklyScheduleData() {
  const relationships = await Relationship.findAll({ raw: true });

  const activeStreets = await Street.findAll({
    where: { status: "Active" },
    attributes: ["streetCode"],
    raw: true,
  });

  const streetCodes = activeStreets.map(street => street.streetCode);
  if (streetCodes.length === 0) {
    throw new Error("No active streets available");
  }

  const shifts = [];
  const allWeekDates = getNextWeekDates();
  const todayDateStr = new Date().toISOString().split("T")[0];

  const upcomingDates = allWeekDates.filter(dateStr => dateStr >= todayDateStr);

  const marshallShiftCount = {};
  relationships.forEach(rel => {
    marshallShiftCount[rel.marshallId] = 0;
  });

  for (const dateStr of upcomingDates) {
    const date = new Date(dateStr).toISOString().split("T")[0];
    const isSaturday = new Date(dateStr).getDay() === 6;

    // On Saturdays only assign Morning, else assign both and shuffle
    let shiftTypes = isSaturday ? ["Morning"] : ["Morning", "Afternoon"];
    shiftTypes = shiftTypes.sort(() => Math.random() - 0.5); // 🔀 Randomize shift order

    const marshallAssignedToday = new Set();

    for (const shiftType of shiftTypes) {
      // 🔀 Randomize street codes for this shift
      let availableStreetCodes = [...streetCodes].sort(() => Math.random() - 0.5);

      // Sort marshalls with fewest shifts first, and exclude those already assigned today
      const sortedRelationships = [...relationships]
        .filter(r => !marshallAssignedToday.has(r.marshallId))
        .sort((a, b) => marshallShiftCount[a.marshallId] - marshallShiftCount[b.marshallId]);

      for (const { marshallId, supervisorId } of sortedRelationships) {
        if (availableStreetCodes.length === 0) break;
        if (marshallAssignedToday.has(marshallId)) continue;

        const streetCode = availableStreetCodes.pop();

        shifts.push({
          marshallId,
          supervisorId,
          date,
          shiftType,
          streetCode,
        });

        marshallShiftCount[marshallId]++;
        marshallAssignedToday.add(marshallId);
      }
    }
  }

  return shifts;
}

module.exports = { generateWeeklyScheduleData };
