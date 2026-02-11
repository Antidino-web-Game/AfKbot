async function equipArmorSet(bot, type) {

  try {

    const armorSlots = [
      { name: `${type}_helmet`, destination: 'head' },
      { name: `${type}_chestplate`, destination: 'torso' },
      { name: `${type}_leggings`, destination: 'legs' },
      { name: `${type}_boots`, destination: 'feet' }
    ]

    for (const armor of armorSlots) {

      const item = bot.inventory.items().find(i => i.name === armor.name)

      if (item) {
        await bot.equip(item, armor.destination)
        console.log("🛡 Equipé :", armor.name)
      }

    }

  } catch (err) {
    console.log("Erreur equip :", err)
  }
}

module.exports = equipArmorSet
