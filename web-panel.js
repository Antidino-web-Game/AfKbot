const express = require('express')
const http = require('http')
const { Server } = require('socket.io')
const path = require('path')
const template = require('./template')
const equipArmorSet = require('./behaviors/armor')

module.exports = function startWebPanel(bot) {

  const app = express()
  const server = http.createServer(app)
  const io = new Server(server)

  // Servir les fichiers statiques
  app.use(express.static(path.join(__dirname, 'public')))
  
  // Servir Three.js depuis CDN
  app.get('/three.js', (req, res) => {
    res.redirect('https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js')
  })

  // Page principale
  app.get('/', (req, res) => {
    res.send(template)
  })

  // Socket handlers
  io.on('connection', socket => {
    console.log('🌐 Client connecté au panel')
    
    // Chat in-game
    bot.on('chat', (username, message) => {
      socket.emit('game_chat', `<${username}> ${message}`)
    })
    
    bot.on('whisper', (username, message) => {
      socket.emit('game_chat', `[WHISPER] ${username}: ${message}`)
    })

    socket.on('request_update', () => {
      try {
        // Vue du bot
        socket.emit('bot_view', {
          yaw: bot.entity.yaw,
          pitch: bot.entity.pitch,
          x: bot.entity.position.x,
          y: bot.entity.position.y,
          z: bot.entity.position.z
        })
        
        // Inventory
        const items = bot.inventory.items().map(i => {
          const displayName = i.displayName || i.name.replace(/_/g, ' ')
          const isFood = i.name.includes('food') || i.name.includes('bread') || 
                        i.name.includes('apple') || i.name.includes('meat') ||
                        i.name.includes('fish') || i.name.includes('potato') ||
                        i.name.includes('carrot') || i.name.includes('beef') ||
                        i.name.includes('pork') || i.name.includes('chicken') ||
                        i.name.includes('mutton') || i.name.includes('rabbit') ||
                        i.name.includes('stew') || i.name.includes('soup') ||
                        i.name.includes('berry') || i.name.includes('melon') ||
                        i.name.includes('cookie')
          
          return {
            name: i.name,
            displayName: displayName,
            count: i.count,
            equipped: bot.heldItem && bot.heldItem.name === i.name,
            isFood: isFood
          }
        })
        socket.emit('inventory', items)

        // Status
        socket.emit('status', {
          health: Math.ceil(bot.health),
          hunger: Math.ceil(bot.food),
          x: bot.entity.position.x,
          y: bot.entity.position.y,
          z: bot.entity.position.z,
          dimension: bot.game.dimension
        })

        // Environment
        const nearbyEntities = Object.values(bot.entities)
          .filter(e => e.type !== 'object' && e.position && e !== bot.entity)
          .map(e => ({
            name: e.name || e.displayName || e.username || 'Unknown',
            distance: bot.entity.position.distanceTo(e.position),
            type: e.type
          }))
          .filter(e => e.distance < 20)
          .sort((a, b) => a.distance - b.distance)
          .slice(0, 10)

        const biome = bot.world ? bot.world.getBiome(bot.entity.position) : { name: 'Unknown' }
        const timeValue = bot.world?.time?.age ? Math.floor(bot.world.time.age / 1000) + ':00' : '0:00'
        
        socket.emit('environment', {
          entities: nearbyEntities,
          biome: biome.name || 'Unknown',
          time: timeValue
        })
      } catch (err) {
        console.log('Erreur update:', err.message)
      }
    })

    socket.on('chat_message', msg => {
      bot.chat(msg)
      socket.emit('game_chat', `[BOT] ${msg}`)
    })

    socket.on('quick_action', action => {
      switch(action) {
        case 'sneak':
          bot.setControlState('sneak', !bot.controlState.sneak)
          break
        case 'jump':
          bot.setControlState('jump', true)
          setTimeout(() => bot.setControlState('jump', false), 300)
          break
        case 'sprint':
          bot.setControlState('sprint', !bot.controlState.sprint)
          break
        case 'attack':
          const target = bot.nearestEntity(e => e.type === 'mob')
          if (target) bot.attack(target)
          break
      }
    })

    socket.on('web_command', ({ site, query }) => {
      let url = ''
      switch(site) {
        case 'google': url = `https://google.com/search?q=${encodeURIComponent(query)}`; break
        case 'youtube': url = `https://youtube.com/results?search_query=${encodeURIComponent(query)}`; break
        case 'wiki': url = `https://wikipedia.org/wiki/${encodeURIComponent(query)}`; break
        case 'reddit': url = `https://reddit.com/search?q=${encodeURIComponent(query)}`; break
        case 'github': url = `https://github.com/search?q=${encodeURIComponent(query)}`; break
        case 'weather': url = `https://google.com/search?q=weather+${encodeURIComponent(query)}`; break
        case 'news': url = `https://news.google.com/search?q=${encodeURIComponent(query)}`; break
        case 'translate': url = `https://translate.google.com/?text=${encodeURIComponent(query)}`; break
      }
      
      bot.chat(`[${site.toUpperCase()}] ${query}: ${url}`)
      socket.emit('game_chat', `✅ Lien envoyé dans le chat Minecraft`)
    })

    socket.on('equip_armor', type => {
      equipArmorSet(bot, type)
    })

    socket.on('eat_food', itemName => {
      const food = bot.inventory.items().find(i => i.name === itemName)
      if (food) {
        if (bot.food >= 20) {
          socket.emit('game_chat', '❌ Déjà rassasié!')
          return
        }
        bot.equip(food, 'hand').then(() => {
          bot.consume().then(() => {
            socket.emit('game_chat', '✅ Nourriture consommée!')
          }).catch(err => {
            socket.emit('game_chat', '❌ Erreur: ' + err.message)
          })
        }).catch(err => console.log('Erreur eat:', err))
      }
    })

    socket.on('use_item', ({ itemName, slot }) => {
      const item = bot.inventory.items().find(i => i.name === itemName)
      if (item) {
        bot.equip(item, 'hand').catch(err => console.log('Erreur equip:', err))
      }
    })

    socket.on('request_world_chunks', () => {
      try {
        const botPos = bot.entity.position
        const centerChunkX = Math.floor(botPos.x / 16)
        const centerChunkZ = Math.floor(botPos.z / 16)
        
        // Envoyer les chunks autour du bot
        for (let cx = centerChunkX - 2; cx <= centerChunkX + 2; cx++) {
          for (let cz = centerChunkZ - 2; cz <= centerChunkZ + 2; cz++) {
            const blocks = []
            
            // Récupérer les blocs du chunk
            for (let x = 0; x < 16; x++) {
              for (let z = 0; z < 16; z++) {
                for (let y = 0; y < 256; y++) {
                  const worldX = cx * 16 + x
                  const worldZ = cz * 16 + z
                  
                  // Limiter à 64 blocs de hauteur pour les performances
                  if (y > 64) continue
                  
                  try {
                    const block = bot.blockAt(new (require('protodef').Vec3)(worldX, y, worldZ))
                    blocks.push(block ? block.name : 'air')
                  } catch (e) {
                    blocks.push('air')
                  }
                }
              }
            }
            
            socket.emit('world_chunk', {
              chunkX: cx,
              chunkZ: cz,
              blocks: blocks
            })
          }
        }
      } catch (err) {
        console.log('Erreur chunks:', err.message)
      }
    })
  })

  server.listen(800, () => {
    console.log("🌐 Panel Web : http://localhost:800")
  })
}
