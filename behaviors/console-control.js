const equipArmorSet = require('./armor')

module.exports = function startConsoleControl(bot) {

  process.stdin.on('data', data => {

    const cmd = data.toString().trim()

    if (cmd.startsWith("armor ")) {
      const type = cmd.split(" ")[1]
      equipArmorSet(bot, type)
      return
    }

    if (cmd.startsWith("/")) bot.chat(cmd)
    else bot.chat(cmd)

  })
}
