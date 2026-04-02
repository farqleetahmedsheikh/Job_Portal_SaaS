/** @format */
import { JobDetailView } from "./JobDetailView";

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const { jobId } = await params;
  return <JobDetailView jobId={jobId} />;
}