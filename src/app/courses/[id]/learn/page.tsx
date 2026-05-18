import { getCourseById } from "@/lib/courses";
import { redirect } from "next/navigation";

export default async function LearnRedirectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const course = await getCourseById(id);

  if (!course || course.chapters.length === 0) {
    redirect(`/courses/${id}`);
  }

  redirect(`/courses/${id}/learn/${course.chapters[0].id}`);
}
