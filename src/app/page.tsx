import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getPublishedCourses } from "@/lib/courses";
import { getSiteSettingsServer } from "@/lib/site-settings";
import HomeClient from "@/components/HomeClient";

// Ensure fresh server-side execution to load dynamic changes instantly
export const revalidate = 0;

export default async function Home() {
  // 1. Fetch user session on the server
  const session = await getServerSession(authOptions);

  // 2. Fetch site settings dynamically (Supabase table with JSON fallback)
  const settings = await getSiteSettingsServer();

  // 3. Fetch dynamic published courses from the database
  const courses = await getPublishedCourses();

  // 4. Render the client-side interactive component with server-side fetched data
  return (
    <HomeClient 
      settings={settings}
      courses={courses}
      session={session}
    />
  );
}
