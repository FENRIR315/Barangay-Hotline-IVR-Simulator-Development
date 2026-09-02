import { createHash } from "node:crypto";
import { PrismaClient, Role, OfficialStatus } from "@prisma/client";

const prisma = new PrismaClient();

const hashPassword = (password: string) =>
  createHash("sha256").update(password).digest("hex");

async function main() {
  console.log("Seeding database...");

  // ---- Users --------------------------------------------------------------
  const captain = await prisma.user.upsert({
    where: { email: "captain@brgyconnect.ph" },
    update: { role: Role.CAPTAIN, active: true },
    create: {
      email: "captain@brgyconnect.ph",
      name: "Juan Dela Cruz",
      passwordHash: hashPassword("password123"),
      role: Role.CAPTAIN,
    },
  });

  const secretary = await prisma.user.upsert({
    where: { email: "secretary@brgyconnect.ph" },
    update: { role: Role.SECRETARY, active: true },
    create: {
      email: "secretary@brgyconnect.ph",
      name: "Maria Santos",
      passwordHash: hashPassword("password123"),
      role: Role.SECRETARY,
    },
  });

  const emergencyUser = await prisma.user.upsert({
    where: { email: "emergency@brgyconnect.ph" },
    update: { role: Role.EMERGENCY_OFFICER, active: true },
    create: {
      email: "emergency@brgyconnect.ph",
      name: "Pedro Reyes",
      passwordHash: hashPassword("password123"),
      role: Role.EMERGENCY_OFFICER,
    },
  });

  const staffUser = await prisma.user.upsert({
    where: { email: "staff@brgyconnect.ph" },
    update: { role: Role.STAFF, active: true },
    create: {
      email: "staff@brgyconnect.ph",
      name: "Ana Villanueva",
      passwordHash: hashPassword("password123"),
      role: Role.STAFF,
    },
  });

  // ---- Officials -----------------------------------------------------------
  const officials = [
    {
      user: captain,
      name: "Juan Dela Cruz",
      position: "Barangay Captain",
      department: "Administration",
      phone: "0917-111-2222",
      extension: "101",
      status: OfficialStatus.AVAILABLE,
      priority: 100,
    },
    {
      user: secretary,
      name: "Maria Santos",
      position: "Barangay Secretary",
      department: "Records",
      phone: "0917-222-3333",
      extension: "102",
      status: OfficialStatus.BUSY,
      priority: 80,
    },
    {
      user: emergencyUser,
      name: "Pedro Reyes",
      position: "Emergency Officer",
      department: "Emergency",
      phone: "0917-333-4444",
      extension: "103",
      status: OfficialStatus.AVAILABLE,
      priority: 90,
    },
    {
      user: staffUser,
      name: "Ana Villanueva",
      position: "Staff",
      department: "Community Affairs",
      phone: "0917-444-5555",
      extension: "104",
      status: OfficialStatus.OFFLINE,
      priority: 50,
    },
  ];

  const officialRows: string[] = [];
  for (const o of officials) {
    const row = await prisma.official.upsert({
      where: {
        name_position: { name: o.name, position: o.position },
      },
      update: { userId: o.user.id },
      create: {
        userId: o.user.id,
        name: o.name,
        position: o.position,
        department: o.department,
        phone: o.phone,
        extension: o.extension,
        status: o.status,
        priority: o.priority,
      },
    });
    officialRows.push(row.id);
  }

  const emergencyOfficerId = officialRows[2];
  const captainOfficialId = officialRows[0];

  // ---- Announcements -------------------------------------------------------
  await prisma.announcement.createMany({
    data: [
      {
        title: "Barangay Clean-Up Drive",
        message:
          "A barangay clean-up drive will be held on Saturday at 8 AM. Please bring trash bags and gloves.",
        priority: "NORMAL",
        startDate: new Date(),
        endDate: new Date(Date.now() + 5 * 86400000),
        active: true,
        createdById: captain.id,
      },
      {
        title: "Free Medical Checkup",
        message:
          "Free medical checkup for residents this Friday, 9 AM to 12 PM at the barangay hall.",
        priority: "URGENT",
        startDate: new Date(),
        endDate: new Date(Date.now() + 3 * 86400000),
        active: true,
        createdById: captain.id,
      },
      {
        title: "Archived: Bingo Night",
        message: "This announcement is inactive and should not be read by the IVR.",
        priority: "NORMAL",
        startDate: new Date(Date.now() - 30 * 86400000),
        endDate: new Date(Date.now() - 20 * 86400000),
        active: false,
        createdById: captain.id,
      },
    ],
  });

  // ---- Escalation rules ----------------------------------------------------
  const escalationNames = ["EMERGENCY", "NORMAL"];
  for (const name of escalationNames) {
    const steps =
      name === "EMERGENCY"
        ? [
            { stepOrder: 1, targetOfficialId: emergencyOfficerId, timeoutSec: 20 },
            { stepOrder: 2, targetOfficialId: captainOfficialId, timeoutSec: 30 },
            { stepOrder: 3, targetOfficialId: officialRows[3], timeoutSec: 60 },
          ]
        : [
            { stepOrder: 1, targetOfficialId: captainOfficialId, timeoutSec: 30 },
            { stepOrder: 2, targetOfficialId: officialRows[1], timeoutSec: 60 },
          ];

    for (const step of steps) {
      await prisma.escalationRule.upsert({
        where: {
          name_stepOrder: { name, stepOrder: step.stepOrder },
        },
        update: { targetOfficialId: step.targetOfficialId, timeoutSec: step.timeoutSec },
        create: {
          name,
          stepOrder: step.stepOrder,
          targetOfficialId: step.targetOfficialId,
          timeoutSec: step.timeoutSec,
        },
      });
    }
  }

  // ---- System settings -----------------------------------------------------
  const settings: Record<string, string> = {
    hotline_number: "09XX-XXX-XXXX",
    barangay_name: "Sample Barangay",
    escalation_default_timeout_sec: "20",
    queue_max_wait_sec: "300",
    recording_notice: "This call may be recorded for barangay records.",
  };
  for (const [key, value] of Object.entries(settings)) {
    await prisma.systemSetting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
  }

  // ---- Sample calls + reports ----------------------------------------------
  // Clear prior demo rows first so re-seeding stays idempotent.
  await prisma.communityReport.deleteMany({ where: { reportNumber: "BRGY-2026-000001" } });
  await prisma.emergencyReport.deleteMany({ where: { call: { callerPhone: "0917-555-5678" } } });
  await prisma.call.deleteMany({
    where: { callerPhone: { in: ["0917-555-1234", "0917-555-5678"] } },
  });

  const completed = await prisma.call.create({
    data: {
      callerPhone: "0917-555-1234",
      callType: "COMPLAINT",
      category: "NOISE",
      priority: "NORMAL",
      status: "COMPLETED",
      assignedOfficialId: officialRows[1],
      startedAt: new Date(Date.now() - 3600000),
      answeredAt: new Date(Date.now() - 3540000),
      endedAt: new Date(Date.now() - 3500000),
      durationSec: 120,
      source: "SIMULATOR",
    },
  });

  await prisma.communityReport.create({
    data: {
      callId: completed.id,
      reportNumber: "BRGY-2026-000001",
      problemType: "NOISE",
      location: "Purok 2, near the basketball court",
      description: "Loud music past midnight.",
      status: "RESOLVED",
      assignedOfficialId: officialRows[1],
    },
  });

  const emergency = await prisma.call.create({
    data: {
      callerPhone: "0917-555-5678",
      callType: "EMERGENCY",
      category: "DISASTER",
      priority: "CRITICAL",
      status: "CONNECTED",
      assignedOfficialId: emergencyOfficerId,
      startedAt: new Date(Date.now() - 300000),
      answeredAt: new Date(Date.now() - 240000),
      durationSec: 240,
      source: "SIMULATOR",
    },
  });

  await prisma.emergencyReport.create({
    data: {
      callId: emergency.id,
      type: "DISASTER",
      priority: "CRITICAL",
      location: "Purok 3, riverside area",
      status: "IN_PROGRESS",
      assignedOfficialId: emergencyOfficerId,
    },
  });

  console.log("Seed completed.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });