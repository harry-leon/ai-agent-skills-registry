import { redirect } from 'next/navigation';

export default async function ComponentRedirectPage({ params }) {
  const { slug } = await params;
  if (!slug || slug.length === 0) {
    redirect('/public');
  }
  const skillSlug = slug[slug.length - 1];
  redirect(`/s/community/${skillSlug}`);
}
