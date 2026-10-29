export async function makeHash(block) {
  const text = JSON.stringify({
    index: block.index,
    data: block.data,
    previousHash: block.previousHash,
    createdAt: block.createdAt,
  })
  const bytes = new TextEncoder().encode(text)
  const result = await crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(result), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

export async function addBlock(chain, data) {
  const block = {
    index: chain.length + 1,
    data,
    previousHash: chain.length === 0 ? '0' : chain[chain.length - 1].hash,
    createdAt: new Date().toISOString(),
  }

  return { ...block, hash: await makeHash(block) }
}

export async function checkBlocks(chain) {
  for (let i = 0; i < chain.length; i++) {
    const block = chain[i]
    const expectedPrevious = i === 0 ? '0' : chain[i - 1].hash

    if (block.previousHash !== expectedPrevious) return false
    if (block.hash !== (await makeHash(block))) return false
  }

  return true
}
