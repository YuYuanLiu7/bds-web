import { redirect } from 'next/navigation';

interface RedirectProps {
  params: Promise<{ id: string }>;
}

export default async function CourseIdRedirectPage({ params }: RedirectProps) {
  const { id } = await params;
  redirect(`/admin/courses/${id}/students`);
}
