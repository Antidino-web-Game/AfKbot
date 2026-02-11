const socket = io()

// FPS VIEW avec Three.js
const canvas = document.getElementById('fps-canvas')
const scene = new THREE.Scene()
scene.background = new THREE.Color(0x87ceeb)
scene.fog = new THREE.Fog(0x87ceeb, 50, 150)

const camera = new THREE.PerspectiveCamera(75, canvas.clientWidth / canvas.clientHeight, 0.1, 1000)
const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true })
renderer.setSize(canvas.clientWidth, canvas.clientHeight)

// Lumières
const ambientLight = new THREE.AmbientLight(0xffffff, 0.8)
scene.add(ambientLight)
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.9)
directionalLight.position.set(50, 100, 50)
directionalLight.castShadow = true
scene.add(directionalLight)

// Système de blocs
const blockSize = 1
const chunkSize = 16
const renderDistance = 2
const chunks = new Map()
const blockMaterials = {
  grass: new THREE.MeshStandardMaterial({ color: 0x228b22 }),
  dirt: new THREE.MeshStandardMaterial({ color: 0x8b6f47 }),
  stone: new THREE.MeshStandardMaterial({ color: 0x808080 }),
  sand: new THREE.MeshStandardMaterial({ color: 0xc2b280 }),
  water: new THREE.MeshStandardMaterial({ color: 0x4169e1, transparent: true, opacity: 0.6 }),
  wood: new THREE.MeshStandardMaterial({ color: 0x8b4513 }),
  leaves: new THREE.MeshStandardMaterial({ color: 0x228b22 }),
  sky: new THREE.MeshStandardMaterial({ color: 0x87ceeb })
}

let botPosition = { x: 0, y: 0, z: 0 }

function getBlockColor(blockName) {
  if (!blockName || blockName === 'air') return null
  if (blockName.includes('grass')) return blockMaterials.grass
  if (blockName.includes('dirt')) return blockMaterials.dirt
  if (blockName.includes('stone')) return blockMaterials.stone
  if (blockName.includes('sand')) return blockMaterials.sand
  if (blockName.includes('water') || blockName.includes('flowing')) return blockMaterials.water
  if (blockName.includes('log') || blockName.includes('wood')) return blockMaterials.wood
  if (blockName.includes('leaves')) return blockMaterials.leaves
  return blockMaterials.stone
}

function createChunk(cx, cz, blocks) {
  const geometry = new THREE.BufferGeometry()
  const positions = []
  const colors = []
  
  // Créer une représentation simple du chunk
  for (let x = 0; x < chunkSize; x++) {
    for (let z = 0; z < chunkSize; z++) {
      for (let y = 0; y < Math.min(blocks.length, 64); y++) {
        const blockIndex = (y * chunkSize * chunkSize) + (z * chunkSize) + x
        if (blockIndex >= blocks.length) continue
        
        const block = blocks[blockIndex]
        if (!block || block === 'air') continue
        
        const worldX = cx * chunkSize + x
        const worldZ = cz * chunkSize + z
        
        // Ajouter un cube simplifié
        const v = [
          worldX, y, worldZ,
          worldX + 1, y, worldZ,
          worldX, y + 1, worldZ,
          worldX + 1, y + 1, worldZ
        ]
        positions.push(...v)
      }
    }
  }
  
  if (positions.length === 0) return null
  
  geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3))
  geometry.computeVertexNormals()
  
  const material = new THREE.MeshStandardMaterial({ 
    color: 0x8b8b8b,
    wireframe: false 
  })
  
  const chunk = new THREE.Mesh(geometry, material)
  chunk.castShadow = true
  chunk.receiveShadow = true
  
  const key = `${cx},${cz}`
  if (chunks.has(key)) {
    scene.remove(chunks.get(key))
  }
  chunks.set(key, chunk)
  scene.add(chunk)
  
  return chunk
}

function updateVisibleChunks(botX, botZ) {
  const centerChunkX = Math.floor(botX / chunkSize)
  const centerChunkZ = Math.floor(botZ / chunkSize)
  
  // Supprimer les chunks lointains
  for (const [key, chunk] of chunks) {
    const [cx, cz] = key.split(',').map(Number)
    const distance = Math.max(Math.abs(cx - centerChunkX), Math.abs(cz - centerChunkZ))
    if (distance > renderDistance) {
      scene.remove(chunk)
      chunks.delete(key)
    }
  }
}

function updateFPSView(botData) {
  if (!botData) return
  
  botPosition = { x: botData.x, y: botData.y, z: botData.z }
  
  // Positionner la caméra au-dessus du bot
  camera.position.set(botData.x, botData.y + 1.6, botData.z)
  
  const yaw = (botData.yaw || 0)
  const pitch = (botData.pitch || 0)
  
  camera.rotation.order = 'YXZ'
  camera.rotation.y = -yaw
  camera.rotation.x = -pitch
  
  // Mettre à jour les chunks visibles
  updateVisibleChunks(botData.x, botData.z)
  
  const directions = ['S', 'SW', 'W', 'NW', 'N', 'NE', 'E', 'SE']
  const dirIndex = Math.round(((yaw + Math.PI) / (Math.PI * 2)) * 8) % 8
  document.getElementById('bot-look').textContent = directions[dirIndex]
  document.getElementById('bot-yaw').textContent = (yaw * 180 / Math.PI).toFixed(1)
  document.getElementById('bot-pitch').textContent = (pitch * 180 / Math.PI).toFixed(1)
}

function animate() {
  requestAnimationFrame(animate)
  renderer.render(scene, camera)
}
animate()

window.addEventListener('resize', () => {
  camera.aspect = canvas.clientWidth / canvas.clientHeight
  camera.updateProjectionMatrix()
  renderer.setSize(canvas.clientWidth, canvas.clientHeight)
})

// Chat
function sendChat() {
  const input = document.getElementById('chat-input')
  const msg = input.value.trim()
  if (msg) {
    socket.emit('chat_message', msg)
    input.value = ''
  }
}

function addChatMessage(msg, type = 'normal') {
  const chat = document.getElementById('game-chat')
  const msgEl = document.createElement('div')
  msgEl.className = 'chat-message ' + type
  msgEl.textContent = msg
  chat.appendChild(msgEl)
  chat.scrollTop = chat.scrollHeight
  
  while (chat.children.length > 100) {
    chat.removeChild(chat.firstChild)
  }
}

// Actions rapides
function quickAction(action) {
  socket.emit('quick_action', action)
  addChatMessage('⚡ Action: ' + action, 'system')
}

// Commandes web
function webCommand(site) {
  const query = prompt('Recherche pour ' + site + ':')
  if (query) {
    socket.emit('web_command', { site, query })
    addChatMessage('🌐 Recherche ' + site + ': ' + query, 'system')
  }
}

// Équiper armure
function equipArmor(type) {
  socket.emit('equip_armor', type)
  addChatMessage('🛡️ Équipement: ' + type, 'system')
}

// Envoyer commande
function sendCommand(cmd) {
  socket.emit('chat_message', cmd)
}

// Manger
function eatFood(itemName) {
  socket.emit('eat_food', itemName)
  addChatMessage('🍗 Mange: ' + itemName, 'system')
}

// Utiliser item
function useItem(itemName, slot) {
  socket.emit('use_item', { itemName, slot })
  addChatMessage('🎒 Utilise: ' + itemName, 'system')
}

// Socket listeners
socket.on('game_chat', msg => {
  addChatMessage(msg)
})

socket.on('bot_view', data => {
  updateFPSView(data)
})

socket.on('world_chunk', data => {
  if (data && data.blocks) {
    createChunk(data.chunkX, data.chunkZ, data.blocks)
  }
})

socket.on('status', data => {
  const healthPercent = (data.health / 20) * 100
  const hungerPercent = (data.hunger / 20) * 100
  
  document.getElementById('health-bar').style.width = healthPercent + '%'
  document.getElementById('health-text').textContent = data.health + ' HP'
  document.getElementById('hunger-bar').style.width = hungerPercent + '%'
  document.getElementById('hunger-text').textContent = data.hunger + ' 🍖'
  
  document.getElementById('position').textContent = 
    data.x.toFixed(0) + ', ' + data.y.toFixed(0) + ', ' + data.z.toFixed(0)
  document.getElementById('dimension').textContent = data.dimension
})

socket.on('environment', data => {
  document.getElementById('biome').textContent = data.biome
  document.getElementById('time').textContent = data.time
  
  const entitiesList = document.getElementById('entities-list')
  if (data.entities && data.entities.length > 0) {
    entitiesList.innerHTML = ''
    data.entities.forEach(entity => {
      const el = document.createElement('div')
      el.className = 'entity-item'
      el.innerHTML = '<span>' + entity.name + '</span><span style="color:#999">' + entity.distance.toFixed(1) + 'm</span>'
      entitiesList.appendChild(el)
    })
  } else {
    entitiesList.innerHTML = '<div style="color: #666; text-align: center; padding: 10px;">Aucune entité</div>'
  }
})

socket.on('inventory', items => {
  const grid = document.getElementById('inventory-grid')
  grid.innerHTML = ''
  
  const foodList = document.getElementById('food-list')
  foodList.innerHTML = ''
  
  items.forEach((item, index) => {
    const slot = document.createElement('div')
    slot.className = 'inv-slot' + (item.equipped ? ' equipped' : '')
    slot.innerHTML = '<div class="item-name">' + item.displayName + '</div><div class="item-count">x' + item.count + '</div>'
    slot.onclick = () => useItem(item.name, index)
    grid.appendChild(slot)
    
    if (item.isFood) {
      const foodItem = document.createElement('div')
      foodItem.className = 'food-item'
      foodItem.innerHTML = '<span>🍗 ' + item.displayName + '</span><span style="color:#999">x' + item.count + '</span>'
      foodItem.onclick = () => eatFood(item.name)
      foodList.appendChild(foodItem)
    }
  })
  
  if (foodList.children.length === 0) {
    foodList.innerHTML = '<div style="color: #666; text-align: center; padding: 20px;">Aucune nourriture</div>'
  }
})

setInterval(() => {
  socket.emit('request_update')
  socket.emit('request_world_chunks')
}, 1000)
