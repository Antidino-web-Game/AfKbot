module.exports = function startHumanBehavior(bot) {

  setInterval(() => {

    if (Math.random() < 0.3) return

    const yaw = Math.random() * Math.PI * 2
    const pitch = (Math.random() - 0.5) * 0.5
    bot.look(yaw, pitch, true)

    if (Math.random() < 0.5) {
      bot.setControlState('forward', true)
      setTimeout(() => bot.setControlState('forward', false), 1000 + Math.random()*2000)
    }

    if (Math.random() < 0.3) {
      bot.setControlState('jump', true)
      setTimeout(() => bot.setControlState('jump', false), 400)
    }

  }, 4000 + Math.random()*4000)
}
