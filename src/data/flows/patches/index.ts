import type { PlayScene, StoryFlow } from '../../../types'
import type { PatchMap } from './types'
import { officePatches } from './office'
import { campusPatches, marryPatches } from './romance-core'
import { lodgePatches, occultPatches, parcelPatches } from './thriller'
import { cafePatches, murimPatches, memoryPatches } from './drama'
import { academyPatches, contractPatches, regressPatches } from './fantasy'
import { idolPatches, palacePatches, rivalPatches } from './romance-stage'

const PATCHES: PatchMap = {
  ...officePatches,
  ...campusPatches,
  ...marryPatches,
  ...idolPatches,
  ...palacePatches,
  ...rivalPatches,
  ...contractPatches,
  ...academyPatches,
  ...regressPatches,
  ...murimPatches,
  ...memoryPatches,
  ...cafePatches,
  ...parcelPatches,
  ...lodgePatches,
  ...occultPatches,
}

/** 큰따옴표를 여닫는 둥근 따옴표로 바꿉니다 (짝이 맞는 문단만). */
export function curly(text: string): string {
  const count = (text.match(/"/g) ?? []).length
  if (count === 0 || count % 2 !== 0) return text
  let open = true
  return text.replace(/"/g, () => {
    const mark = open ? '“' : '”'
    open = !open
    return mark
  })
}

const curlyAll = (list: string[]) => list.map(curly)

function patchScene(scene: PlayScene): PlayScene {
  const patch = PATCHES[scene.id]
  const body = patch?.body ?? scene.body
  const lead = patch?.lead ?? scene.lead
  return {
    ...scene,
    body: curlyAll(body),
    lead: lead ? { A: curlyAll(lead.A), B: curlyAll(lead.B) } : undefined,
    choices: scene.choices.map((choice) => ({
      ...choice,
      label: curly(choice.label),
      result: curlyAll(patch?.results?.[choice.id] ?? choice.result),
    })),
  }
}

export function applyPatches(flow: StoryFlow): StoryFlow {
  return {
    ...flow,
    scenes: flow.scenes.map(patchScene),
    endings: flow.endings.map((ending) => ({
      ...ending,
      body: curlyAll(PATCHES[ending.id]?.endingBody ?? ending.body),
    })),
  }
}
