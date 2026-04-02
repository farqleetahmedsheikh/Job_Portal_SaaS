/** @format */

import { ApplicantsView } from "./ApplicantsView";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ApplicantsPage({ params }: PageProps) {
  const { id } = await params;
  console.log(await params);
  return <ApplicantsView id={id} />;
}
