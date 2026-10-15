import type { CaseDefinition, Task } from '../../../types'
import { AssignTask } from './AssignTask'
import { BoardTask } from './BoardTask'
import { DialogueTask } from './DialogueTask'
import { EliminationTask } from './EliminationTask'
import { HotspotTask } from './HotspotTask'
import { InspectTask } from './InspectTask'
import { PlacementTask } from './PlacementTask'
import { ReportTask } from './ReportTask'
import { SceneChoiceTask } from './SceneChoiceTask'
import { SequenceTask } from './SequenceTask'

interface Props { task: Task; def: CaseDefinition; solved: boolean; onSolved: (t?: string) => void }

/** Task registry: maps a data-driven task type to its interaction component. Add new types here. */
export function TaskView({ task, def, solved, onSolved }: Props) {
  const p = { def, solved, onSolved }
  switch (task.type) {
    case 'hotspot': return <HotspotTask task={task} {...p} />
    case 'scene-choice': return <SceneChoiceTask task={task} {...p} />
    case 'placement': return <PlacementTask task={task} {...p} />
    case 'dialogue': return <DialogueTask task={task} {...p} />
    case 'assign': return <AssignTask task={task} {...p} />
    case 'board': return <BoardTask task={task} {...p} />
    case 'elimination': return <EliminationTask task={task} {...p} />
    case 'sequence': return <SequenceTask task={task} {...p} />
    case 'inspect': return <InspectTask task={task} {...p} />
    case 'report': return <ReportTask task={task} {...p} />
  }
}
