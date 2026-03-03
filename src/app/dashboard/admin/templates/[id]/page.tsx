import { TemplateForm } from "../TemplateForm";

export default async function EditTemplatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <TemplateForm id={id} initial={null} />;
}
