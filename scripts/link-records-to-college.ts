import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🔗 Linking existing records to default GPGCQ college...");

  const gpgcq = await prisma.college.findFirst({
    where: { code: "GPGCQ" }
  });

  if (!gpgcq) {
    console.error("❌ GPGCQ College not found!");
    return;
  }

  console.log(`Found GPGCQ college with ID: ${gpgcq.id}`);

  const updatedStudents = await prisma.student.updateMany({
    where: { collegeId: null },
    data: { collegeId: gpgcq.id }
  });
  console.log(`✅ Updated ${updatedStudents.count} students`);

  const updatedFaculty = await prisma.faculty.updateMany({
    where: { collegeId: null },
    data: { collegeId: gpgcq.id }
  });
  console.log(`✅ Updated ${updatedFaculty.count} faculty`);

  const updatedUsers = await prisma.user.updateMany({
    where: {
      collegeId: null,
      role: { not: "CHTE_ADMIN" }
    },
    data: { collegeId: gpgcq.id }
  });
  console.log(`✅ Updated ${updatedUsers.count} users`);

  const updatedAdmissions = await prisma.admission.updateMany({
    where: { collegeId: null },
    data: { collegeId: gpgcq.id }
  });
  console.log(`✅ Updated ${updatedAdmissions.count} admissions`);

  const updatedChallans = await prisma.challan.updateMany({
    where: { collegeId: null },
    data: { collegeId: gpgcq.id }
  });
  console.log(`✅ Updated ${updatedChallans.count} challans`);

  const updatedFees = await prisma.fee.updateMany({
    where: { collegeId: null },
    data: { collegeId: gpgcq.id }
  });
  console.log(`✅ Updated ${updatedFees.count} fees`);

  const updatedTimetables = await prisma.timetable.updateMany({
    where: { collegeId: null },
    data: { collegeId: gpgcq.id }
  });
  console.log(`✅ Updated ${updatedTimetables.count} timetables`);

  const updatedDatesheets = await prisma.datesheet.updateMany({
    where: { collegeId: null },
    data: { collegeId: gpgcq.id }
  });
  console.log(`✅ Updated ${updatedDatesheets.count} datesheets`);

  const updatedExpenses = await prisma.expense.updateMany({
    where: { collegeId: null },
    data: { collegeId: gpgcq.id }
  });
  console.log(`✅ Updated ${updatedExpenses.count} expenses`);

  const updatedAuditLogs = await prisma.auditLog.updateMany({
    where: { collegeId: null },
    data: { collegeId: gpgcq.id }
  });
  console.log(`✅ Updated ${updatedAuditLogs.count} audit logs`);

  const updatedFeeSettings = await prisma.feeSettings.updateMany({
    where: { collegeId: null },
    data: { collegeId: gpgcq.id }
  });
  console.log(`✅ Updated ${updatedFeeSettings.count} fee settings`);

  console.log("🎉 All records linked to GPGCQ successfully!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
