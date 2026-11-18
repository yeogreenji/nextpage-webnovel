import type { PlayChoice, PlayEnding, StoryFlow } from '../../../types'
import { FLOW_STRUCTURE } from '../kit'
import type { ChoiceSeed } from '../kit'
import { romanceExtras, romanceThirdEndings } from './romance'
import { palaceExtras, palaceThirdEndings } from './palace'
import { dramaExtras, dramaThirdEndings } from './drama'
import { genreExtras, genreThirdEndings } from './genre'

/**
 * 기존 15작품의 세 번째 갈래와 세 번째 엔딩.
 * — 장면마다 다른 태도 하나를 더해 3~4지선다로 만들고,
 *   마지막 장면에는 C 갈래와 그에 맞는 엔딩을 붙입니다.
 */
const EXTRAS: Record<string, ChoiceSeed[]> = {
  ...romanceExtras,
  ...palaceExtras,
  ...dramaExtras,
  ...genreExtras,
}

const THIRD_ENDINGS: Record<string, PlayEnding> = {
  ...romanceThirdEndings,
  ...palaceThirdEndings,
  ...dramaThirdEndings,
  ...genreThirdEndings,
}

export function applyExtras(flow: StoryFlow): StoryFlow {
  const scenes = flow.scenes.map((scene) => {
    const extra = EXTRAS[scene.id]
    if (!extra || extra.length === 0) return scene
    const added: PlayChoice[] = extra.map((choice, index) => ({
      id: `${scene.id}-x${index + 1}`,
      label: choice.label,
      hint: choice.hint,
      result: choice.result,
      tone: choice.tone,
      ...(choice.lead && choice.lead.length > 0 ? { lead: choice.lead } : {}),
    }))
    return { ...scene, choices: [...scene.choices, ...added] }
  })

  const ending = THIRD_ENDINGS[flow.novelId]

  return {
    ...flow,
    structure: FLOW_STRUCTURE,
    scenes,
    endings: ending ? [...flow.endings, ending] : flow.endings,
  }
}
