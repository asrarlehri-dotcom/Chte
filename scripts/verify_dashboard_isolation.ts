import { getCompleteDashboardData } from "../src/app/shared-actions";
import { prisma } from "../src/lib/prisma";

async function main() {
  console.log("=================================================");
  console.log("       MULTI-TENANT DASHBOARD DATA VERIFICATION   ");
  console.log("=================================================");

  const colleges = await prisma.college.findMany();

  for (const c of colleges) {
    const data = await getCompleteDashboardData("ALL", "ALL", c.id);
    console.log(`\n🏫 College: [${c.code}] ${c.name}`);
    console.log(`   ID: ${c.id}`);
    console.log(`   Top Metrics:`, JSON.stringify(data.topMetrics));
    console.log(`   Status Overview:`, JSON.stringify(data.statusOverview));
    console.log(`   Fee Summary:`, JSON.stringify(data.feeSummary));
    console.log(`   Programs Count:`, data.programWiseEnrollment.length);
    console.log(`   Recent Notices:`, data.recentNotices.length);
    console.log(`   Today's Schedule:`, data.upcomingSchedule.length);
  }

  // Provincial Super Admin (no collegeId)
  console.log(`\n🌐 Super Admin (Provincial Aggregate - collegeId = null):`);
  const provincialData = await getCompleteDashboardData("ALL", "ALL", null);
  console.log(`   Top Metrics:`, JSON.stringify(provincialData.topMetrics));
  console.log(`   Status Overview:`, JSON.stringify(provincialData.statusOverview));
  console.log(`   Fee Summary:`, JSON.stringify(provincialData.feeSummary));

  // Brand New College (Empty stats test)
  console.log(`\n🆕 Brand-New College (Zero-State Test):`);
  const emptyCollegeData = await getCompleteDashboardData("ALL", "ALL", "00000000-0000-0000-0000-000000000000");
  console.log(`   Top Metrics:`, JSON.stringify(emptyCollegeData.topMetrics));
  console.log(`   Status Overview:`, JSON.stringify(emptyCollegeData.statusOverview));
  console.log(`   Fee Summary:`, JSON.stringify(emptyCollegeData.feeSummary));
  console.log(`   Programs Count:`, emptyCollegeData.programWiseEnrollment.length);
  console.log(`   Recent Notices:`, emptyCollegeData.recentNotices.length);
  console.log(`   Today's Schedule:`, emptyCollegeData.upcomingSchedule.length);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

