import type { Episode, VoteRecord } from '../types'
import { tallyVotes } from './vote'

export interface LayoutNode {
  episode: Episode
  depth: number
  x: number
  y: number
}

export interface LayoutEdge {
  from: LayoutNode
  to: LayoutNode
  label: string
  adopted: boolean
  pending: boolean
}

export interface TreeLayout {
  nodes: LayoutNode[]
  edges: LayoutEdge[]
  width: number
  height: number
  nodeWidth: number
  nodeHeight: number
}

const NODE_WIDTH = 216
const NODE_HEIGHT = 88
const ROW_GAP = 152
const TOP_PADDING = 24
const SIDE_PADDING = 20

/**
 * 회차의 parentEpisodeId 로 분기 트리를 만들고, 부모가 자식들 가운데 놓이도록 배치합니다.
 * 채택 루트(현재 1위 선택지)는 굵은 선으로 표시합니다.
 */
export function layoutTree(episodes: Episode[], votes: VoteRecord[]): TreeLayout {
  const byId = new Map(episodes.map((episode) => [episode.id, episode]))
  const children = new Map<string, Episode[]>()

  for (const episode of episodes) {
    const parent = episode.parentEpisodeId
    if (!parent || !byId.has(parent)) continue
    const list = children.get(parent) ?? []
    list.push(episode)
    children.set(parent, list)
  }

  // 형제 순서: 부모 회차의 선택지 순서(A → B)
  for (const [parentId, list] of children) {
    const parent = byId.get(parentId)
    const order = parent?.choices.map((choice) => choice.targetEpisodeId) ?? []
    list.sort((a, b) => {
      const ai = order.indexOf(a.id)
      const bi = order.indexOf(b.id)
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi)
    })
  }

  const roots = episodes
    .filter((episode) => !episode.parentEpisodeId || !byId.has(episode.parentEpisodeId))
    .sort((a, b) => a.no - b.no)

  const depthOf = new Map<string, number>()
  let frontier = roots
  let depth = 0
  while (frontier.length > 0) {
    const next: Episode[] = []
    for (const episode of frontier) {
      if (depthOf.has(episode.id)) continue
      depthOf.set(episode.id, depth)
      next.push(...(children.get(episode.id) ?? []))
    }
    frontier = next
    depth += 1
    if (depth > 20) break
  }

  // 고아 노드(부모가 없는 새 회차)도 마지막 줄에 포함
  for (const episode of episodes) {
    if (!depthOf.has(episode.id)) depthOf.set(episode.id, depth)
  }

  const maxDepth = Math.max(0, ...Array.from(depthOf.values()))
  const levels: Episode[][] = Array.from({ length: maxDepth + 1 }, () => [])
  for (const episode of episodes) {
    levels[depthOf.get(episode.id) ?? 0].push(episode)
  }

  // 형제 순서(A → B)를 지키는 DFS 순번
  const preorder = new Map<string, number>()
  let counter = 0
  const walk = (episode: Episode) => {
    if (preorder.has(episode.id)) return
    preorder.set(episode.id, counter++)
    for (const child of children.get(episode.id) ?? []) walk(child)
  }
  roots.forEach(walk)
  episodes.forEach((episode) => walk(episode))
  levels.forEach((level) =>
    level.sort((a, b) => (preorder.get(a.id) ?? 0) - (preorder.get(b.id) ?? 0)),
  )

  // 아래층부터 배치: 부모는 자식들의 가운데, 겹치면 최소 간격으로 밀어낸다
  const minGap = NODE_WIDTH + 28
  const rawX = new Map<string, number>()

  ;(levels[maxDepth] ?? []).forEach((episode, index) => rawX.set(episode.id, index * minGap))

  for (let level = maxDepth - 1; level >= 0; level -= 1) {
    const nodesAtLevel = levels[level] ?? []
    for (const episode of nodesAtLevel) {
      const kids = (children.get(episode.id) ?? []).filter((child) => rawX.has(child.id))
      if (kids.length > 0) {
        const mean = kids.reduce((sum, child) => sum + (rawX.get(child.id) ?? 0), 0) / kids.length
        rawX.set(episode.id, mean)
      }
    }
    nodesAtLevel.forEach((episode, index) => {
      if (!rawX.has(episode.id)) {
        const previous = index > 0 ? rawX.get(nodesAtLevel[index - 1].id) : undefined
        rawX.set(episode.id, previous === undefined ? 0 : previous + minGap)
      }
    })
    for (let index = 1; index < nodesAtLevel.length; index += 1) {
      const previousX = rawX.get(nodesAtLevel[index - 1].id) ?? 0
      const currentX = rawX.get(nodesAtLevel[index].id) ?? 0
      if (currentX - previousX < minGap) rawX.set(nodesAtLevel[index].id, previousX + minGap)
    }
  }

  const xs = Array.from(rawX.values())
  const minRawX = xs.length > 0 ? Math.min(...xs) : 0
  const maxRawX = xs.length > 0 ? Math.max(...xs) : 0
  const width = Math.max(680, maxRawX - minRawX + NODE_WIDTH + SIDE_PADDING * 2)
  const offset = (width - (maxRawX - minRawX + NODE_WIDTH)) / 2
  const height = TOP_PADDING * 2 + maxDepth * ROW_GAP + NODE_HEIGHT

  const nodes: LayoutNode[] = []
  levels.forEach((level, levelIndex) => {
    level.forEach((episode) => {
      nodes.push({
        episode,
        depth: levelIndex,
        x: (rawX.get(episode.id) ?? 0) - minRawX + offset + NODE_WIDTH / 2,
        y: TOP_PADDING + levelIndex * ROW_GAP,
      })
    })
  })

  const nodeById = new Map(nodes.map((node) => [node.episode.id, node]))
  const edges: LayoutEdge[] = []

  for (const episode of episodes) {
    if (!episode.parentEpisodeId) continue
    const from = nodeById.get(episode.parentEpisodeId)
    const to = nodeById.get(episode.id)
    if (!from || !to) continue
    const parent = byId.get(episode.parentEpisodeId)
    const adoptedId =
      parent && parent.choices.length > 0 ? tallyVotes(parent, votes).leaderId : null
    const choice = parent?.choices.find((item) => item.targetEpisodeId === episode.id)
    edges.push({
      from,
      to,
      label: choice?.label ?? episode.branchLabel ?? '',
      adopted: Boolean(choice && choice.id === adoptedId),
      pending: episode.status === 'pending',
    })
  }

  return { nodes, edges, width, height, nodeWidth: NODE_WIDTH, nodeHeight: NODE_HEIGHT }
}

/** 루트에서 이 회차까지의 경로 (읽기 순서 안내용) */
export function pathToEpisode(episodes: Episode[], targetId: string): Episode[] {
  const byId = new Map(episodes.map((episode) => [episode.id, episode]))
  const path: Episode[] = []
  let current = byId.get(targetId)
  let guard = 0
  while (current && guard < 30) {
    path.unshift(current)
    current = current.parentEpisodeId ? byId.get(current.parentEpisodeId) : undefined
    guard += 1
  }
  return path
}

/** 선택지가 이어지는 다음 회차 (집필 중이면 null) */
export function nextPublishedEpisode(
  episodes: Episode[],
  choiceId: string,
): Episode | null {
  const choice = episodes
    .flatMap((episode) => episode.choices)
    .find((item) => item.id === choiceId)
  if (!choice || !choice.targetEpisodeId) return null
  const next = episodes.find((episode) => episode.id === choice.targetEpisodeId)
  return next && next.status === 'published' ? next : null
}
