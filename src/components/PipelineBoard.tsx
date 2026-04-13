import { KanbanFilterPipeline } from "@/components/KanbanFilterPipeline";
import { PortalShell } from "@/components/PortalShell";
import type { KanbanDesignId } from "@/kanban/kanbanDesigns";

type PipelineBoardProps = {
  design: KanbanDesignId;
};

/** Pipeline — portal kabuğu + filtre + Kanban */
export function PipelineBoard({ design }: PipelineBoardProps) {
  return (
    <PortalShell>
      <KanbanFilterPipeline design={design} interaction="navigate" />
    </PortalShell>
  );
}
