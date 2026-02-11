module.exports = function startAutoDefense(bot) {

  setInterval(() => {

    const target = bot.nearestEntity(entity => {
      if (!entity) return false
      if (entity.type !== 'mob') return false
      if (!entity.position) return false
      return bot.entity.position.distanceTo(entity.position) < 4
    })

    if (target) {
      console.log("⚔ Attaque :", target.name)
      bot.attack(target)
    }

  }, 10)
}
