/** @format */
import { EditJobView } from "./EditViewJob";

export default async function EditJobPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <EditJobView id={id} />;
}
