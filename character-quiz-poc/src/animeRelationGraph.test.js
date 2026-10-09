import assert from 'node:assert/strict'
import test from 'node:test'
import { ANIME_RELATION_LABELS, buildAnimeRelationGraph, groupAnimeRelations } from './animeRelationLayout.js'

const relations = [
  { anilistId: 1, relationType: 'PREQUEL', mediaType: 'ANIME', title: 'Before', seriesId: 'before' },
  { anilistId: 2, relationType: 'SEQUEL', mediaType: 'ANIME', title: 'After' },
  { anilistId: 3, relationType: 'SOURCE', mediaType: 'MANGA', title: 'Source' },
  { anilistId: 4, relationType: 'PREQUEL', mediaType: 'ANIME', title: 'Earlier' },
]

test('graph preserves links, groups and filters without inferring relation types', () => {
  const graph = buildAnimeRelationGraph(relations)
  assert.equal(graph.nodes.length, 3)
  assert.ok(graph.nodes.filter((node) => node.relationType === 'PREQUEL').every((node) => node.x < graph.center.x))
  assert.ok(graph.nodes.filter((node) => node.relationType === 'SEQUEL').every((node) => node.x > graph.center.x))
  assert.equal(graph.nodes[0].seriesId, 'before')
  assert.equal(buildAnimeRelationGraph(relations, { animeOnly: false }).nodes.length, 4)
  assert.equal(buildAnimeRelationGraph(relations, { type: 'SEQUEL' }).nodes.length, 1)
  assert.equal(buildAnimeRelationGraph(relations, { type: 'SOURCE' }).nodes.length, 0)
  assert.equal(groupAnimeRelations([{ relationType: 'NEW_TYPE' }])[0].label, 'NEW_TYPE')
  for (const type of ['PREQUEL', 'SEQUEL', 'MIDQUEL', 'INTERQUEL', 'PARAQUEL', 'SPIN_OFF', 'REMAKE', 'REBOOT']) {
    assert.ok(ANIME_RELATION_LABELS[type])
  }
})

test('graph keeps all nodes inside its canvas with non-overlapping cards', () => {
  const items = Array.from({ length: 75 }, (_, index) => ({
    anilistId: index, mediaType: 'ANIME', relationType: index % 3 ? 'SEQUEL' : 'PREQUEL',
  }))
  const graph = buildAnimeRelationGraph(items)
  assert.equal(graph.nodes.length, items.length)
  const sorted = graph.nodes.toSorted((a, b) => a.y - b.y)
  sorted.forEach((node, index) => {
    assert.ok(node.x + node.width <= graph.width)
    assert.ok(node.y + node.height <= graph.height)
    for (const other of sorted.slice(0, index)) {
      assert.ok(other.x + other.width <= node.x || node.x + node.width <= other.x || other.y + other.height <= node.y || node.y + node.height <= other.y)
    }
  })

  assert.equal(buildAnimeRelationGraph([]).nodes.length, 0)
})

test('spin-offs branch below current anime and small timelines stay compact', () => {
  const graph = buildAnimeRelationGraph([...relations, { anilistId: 10, mediaType: 'ANIME', relationType: 'SPIN_OFF' }])
  assert.ok(graph.nodes.find((node) => node.relationType === 'SPIN_OFF').y > graph.center.y + graph.center.height)
  assert.ok(buildAnimeRelationGraph(relations.slice(0, 2)).height <= 160)
})
