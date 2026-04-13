-- KanbanBoardSettings: panoda gizlenen yerleşik aşamalar
CREATE TABLE "KanbanBoardSettings" (
    "id" TEXT NOT NULL,
    "hiddenBuiltinStageIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],

    CONSTRAINT "KanbanBoardSettings_pkey" PRIMARY KEY ("id")
);
