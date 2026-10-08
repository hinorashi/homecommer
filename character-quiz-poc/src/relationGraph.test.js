import test from 'node:test'
import assert from 'node:assert/strict'
import { buildRelationGraph, relationLabelVi, splitSpoilers } from './relationGraph.js'

const node = (id, name) => ({ id: `anilist-${id}`, anilistId: id, name, image: null })

const relations = {
  direct: [
    { anilistId: 1, name: 'A', label: 'sister', spoiler: false, direction: 'out', character: node(1, 'A') },
    { anilistId: 2, name: 'B', label: null, spoiler: true, direction: 'in', character: null },
    { anilistId: 3, name: 'C', label: null, reverseLabel: 'rival', spoiler: false, direction: 'both', character: node(3, 'C') },
  ],
  clusters: [
    { series: { id: 'anilist-10', title: 'Show' }, characters: [{ role: 'MAIN', character: node(4, 'D') }, { role: 'SUPPORTING', character: node(5, 'E') }] },
  ],
}

test('buildRelationGraph hides spoilers by default and builds hubs, leaves and edges', () => {
  const graph = buildRelationGraph(relations, { size: 600 })
  assert.equal(graph.hubs.length, 2)
  assert.deepEqual(graph.leaves.map((leaf) => leaf.name), ['A', 'C', 'D', 'E'])
  assert.equal(graph.edges.filter((edge) => edge.kind === 'trunk').length, 2)
  assert.equal(graph.edges.filter((edge) => edge.kind === 'branch').length, 4)
  assert.equal(graph.leaves[0].edgeLabel, 'Chị/em gái')
  assert.equal(graph.leaves[1].edgeLabel, 'Đối thủ')
  for (const leaf of graph.leaves) {
    assert.ok(leaf.x >= 0 && leaf.x <= 600 && leaf.y >= 0 && leaf.y <= 600, `${leaf.name} stays inside the viewBox`)
  }
})

test('buildRelationGraph can include spoilers, external nodes and filter groups', () => {
  const withSpoilers = buildRelationGraph(relations, { showSpoilers: true, showClusters: false })
  assert.equal(withSpoilers.hubs.length, 1)
  const external = withSpoilers.leaves.find((leaf) => leaf.anilistId === 2)
  assert.equal(external.characterId, null)
  assert.equal(external.spoiler, true)
  assert.equal(external.edgeLabel, 'Có liên hệ')

  const empty = buildRelationGraph({ direct: [], clusters: [] })
  assert.equal(empty.leafCount, 0)
  assert.equal(empty.edges.length, 0)
})

test('relationLabelVi falls back for unknown keys', () => {
  assert.equal(relationLabelVi('best-friend'), 'Bạn thân')
  assert.equal(relationLabelVi('mystery'), 'mystery')
  assert.equal(relationLabelVi(null), 'Có liên hệ')
})

test('splitSpoilers separates AniList spoiler markers', () => {
  assert.deepEqual(splitSpoilers('Hello ~!secret!~ world'), [
    { spoiler: false, text: 'Hello ' },
    { spoiler: true, text: 'secret' },
    { spoiler: false, text: ' world' },
  ])
  assert.deepEqual(splitSpoilers('plain'), [{ spoiler: false, text: 'plain' }])
  assert.deepEqual(splitSpoilers(''), [])
})

test('splitSpoilers hides everything after an unclosed marker and drops stray closers', () => {
  assert.deepEqual(splitSpoilers('Intro ~!truncated secret'), [
    { spoiler: false, text: 'Intro ' },
    { spoiler: true, text: 'truncated secret' },
  ])
  assert.deepEqual(splitSpoilers('odd !~ closer'), [{ spoiler: false, text: 'odd  closer' }])
})
