var exports = module.exports = {};

const fetch = require('node-fetch');

var manifestVersion = "";
var itemDefinitions = {};

const ItemCategory = {
  WEAPON: 1,
  WEAPON_KINETIC: 2,
  WEAPON_ENERGY: 3,
  WEAPON_POWER: 4,
  ARMOR_WARLOCK: 21,
  ARMOR_TITAN: 22,
  ARMOR_HUNTER: 23,
  ARMOR_HELMET: 45,
  ARMOR_ARMS: 46,
  ARMOR_CHEST: 47,
  ARMOR_LEGS: 48,
  ARMOR_CLASS: 49
}

exports.getMaxPowerItems = async function (destinyData) {
  await getManifest();

  var profilePower = {
    weapons: [0, 0, 0],
    warlock: [0, 0, 0, 0, 0],
    titan: [0, 0, 0, 0, 0],
    hunter: [0, 0, 0, 0, 0],
  };

  if (itemDefinitions && destinyData.itemComponents.instances.data) {
    let allItems = [];

    if (destinyData.profileInventory.data.items) {
      destinyData.profileInventory.data.items.forEach(item => {
        let itemInstance = destinyData.itemComponents.instances.data[item.itemInstanceId];
        if (itemInstance) {
          allItems.push({
            id: item.itemHash,
            power: itemInstance && itemInstance.primaryStat ? itemInstance.primaryStat.value : 0
          });
        }
      });
    }

    if (destinyData.characterInventories.data) {
      for (charId in destinyData.characterInventories.data) {
        let characterInventory = destinyData.characterInventories.data[charId];
        characterInventory.items.forEach(item => {
          let itemInstance = destinyData.itemComponents.instances.data[item.itemInstanceId];
          if (itemInstance) {
            allItems.push({
              id: item.itemHash,
              power: itemInstance && itemInstance.primaryStat ? itemInstance.primaryStat.value : 0
            });
          }
        });
      }
    }

    if (destinyData.characterEquipment.data) {
      for (charId in destinyData.characterEquipment.data) {
        let characterEquipment = destinyData.characterEquipment.data[charId];
        characterEquipment.items.forEach(item => {
          let itemInstance = destinyData.itemComponents.instances.data[item.itemInstanceId];
          if (itemInstance) {
            allItems.push({
              id: item.itemHash,
              power: itemInstance && itemInstance.primaryStat ? itemInstance.primaryStat.value : 0
            });
          }
        });
      }
    }

    profilePower.weapons[0] = getMaxPowerForCategory(allItems, [ItemCategory.WEAPON_KINETIC]);
    profilePower.weapons[1] = getMaxPowerForCategory(allItems, [ItemCategory.WEAPON_ENERGY]);
    profilePower.weapons[2] = getMaxPowerForCategory(allItems, [ItemCategory.WEAPON_POWER]);

    profilePower.warlock[0] = getMaxPowerForCategory(allItems, [ItemCategory.ARMOR_WARLOCK, ItemCategory.ARMOR_HELMET]);
    profilePower.warlock[1] = getMaxPowerForCategory(allItems, [ItemCategory.ARMOR_WARLOCK, ItemCategory.ARMOR_ARMS]);
    profilePower.warlock[2] = getMaxPowerForCategory(allItems, [ItemCategory.ARMOR_WARLOCK, ItemCategory.ARMOR_CHEST]);
    profilePower.warlock[3] = getMaxPowerForCategory(allItems, [ItemCategory.ARMOR_WARLOCK, ItemCategory.ARMOR_LEGS]);
    profilePower.warlock[4] = getMaxPowerForCategory(allItems, [ItemCategory.ARMOR_WARLOCK, ItemCategory.ARMOR_CLASS]);

    profilePower.titan[0] = getMaxPowerForCategory(allItems, [ItemCategory.ARMOR_TITAN, ItemCategory.ARMOR_HELMET]);
    profilePower.titan[1] = getMaxPowerForCategory(allItems, [ItemCategory.ARMOR_TITAN, ItemCategory.ARMOR_ARMS]);
    profilePower.titan[2] = getMaxPowerForCategory(allItems, [ItemCategory.ARMOR_TITAN, ItemCategory.ARMOR_CHEST]);
    profilePower.titan[3] = getMaxPowerForCategory(allItems, [ItemCategory.ARMOR_TITAN, ItemCategory.ARMOR_LEGS]);
    profilePower.titan[4] = getMaxPowerForCategory(allItems, [ItemCategory.ARMOR_TITAN, ItemCategory.ARMOR_CLASS]);

    profilePower.hunter[0] = getMaxPowerForCategory(allItems, [ItemCategory.ARMOR_HUNTER, ItemCategory.ARMOR_HELMET]);
    profilePower.hunter[1] = getMaxPowerForCategory(allItems, [ItemCategory.ARMOR_HUNTER, ItemCategory.ARMOR_ARMS]);
    profilePower.hunter[2] = getMaxPowerForCategory(allItems, [ItemCategory.ARMOR_HUNTER, ItemCategory.ARMOR_CHEST]);
    profilePower.hunter[3] = getMaxPowerForCategory(allItems, [ItemCategory.ARMOR_HUNTER, ItemCategory.ARMOR_LEGS]);
    profilePower.hunter[4] = getMaxPowerForCategory(allItems, [ItemCategory.ARMOR_HUNTER, ItemCategory.ARMOR_CLASS]);
  }

  return profilePower;
}

function getMaxPowerForCategory(allItems, categories) {
  const selection = allItems.filter(item => {
    let itemDefinition = itemDefinitions[item.id];
    return itemDefinition ? categories.every(category => itemDefinition.includes(category)) : false;
    // return itemDefinition ? itemDefinition.includes(category) : false;
  });
  return selection.map(item => item.power).reduce((max, cur) => { return Math.max(max, cur) }, 0);
}

async function getManifest() {
  return await fetch('https://www.bungie.net/Platform//Destiny2/Manifest')
    .then(response => response.json())
    .then(async (data) => {
      if (data.ErrorCode != 1) {
        console.log(`Error retrieving manifest links (${data.Message})`);
        return;
      }

      if ((manifestVersion == data.Response.version) && itemDefinitions) {
        console.log('Manifest is up to date');
        return;
      }

      manifestVersion = data.Response.version
      return await fetch(`https://www.bungie.net/${data.Response.jsonWorldComponentContentPaths.en.DestinyInventoryItemLiteDefinition}`)
        .then(response => response.json())
        .then(data => {
          for (item in data) {
            if (data[item].itemType == 2 || data[item].itemType == 3) {
              itemDefinitions[item] = data[item].itemCategoryHashes;
            }
          }
        });
    });
}
