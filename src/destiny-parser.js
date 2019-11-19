var exports = module.exports = {};

const manifest = require('./manifest');

// These functions receive the whole data payload from the destiny API and parse it for specific stuff that is
// required to aquire a particular title and will return this data in the following format:
// name: the name of the title
// color: the color of the title
// isRedeemable: if all triumphs are complete this will be true, false otherwise
// triumphs: an array of triumphs
//  name: name of the triumph
//  description: flavour text
//  iconPath: URI for an icon from Bungie
//  isComplete: if all objectives are complete this will be true, false otherwise
//  objectives: an array of objectives
//    hint: short descriptive string
//    isComplete: if curValue >= reqValue this will be true, false otherwise
//    curValue: current progress
//    reqValue: required value
//    collectionProgress: contains a list of items and their state
//      icon: item icon
//      isAquired: true if collectible was aquired

const RecordStatus = {
  COMPLETED: 1,
  NOT_COMPLETED: 4
}

const CollectibleStatus = {
  NOT_ACQUIRED: 1
}

exports.getTitleDefinitions = async function (destinyData) {
  const profilePower = await calculateProfilePower(destinyData);
  let [maxedTitle, ascendantTitle] = parsePower(profilePower);

  let titleDefinitions = [];
  titleDefinitions.push(maxedTitle);
  titleDefinitions.push(ascendantTitle);
  titleDefinitions.push(parseTriumphs(destinyData));
  titleDefinitions.push(parseSeals(destinyData));
  titleDefinitions.push(parseRaid(destinyData));
  titleDefinitions.push(parseCrucible(destinyData));
  titleDefinitions.push(parseGambit(destinyData));
  titleDefinitions.push(parseVanguard(destinyData));

  return titleDefinitions
}

function isCollectibleAquired(destinyData, id) {
  return !(destinyData.profileCollectibles.data.collectibles[id].state & CollectibleStatus.NOT_ACQUIRED);
}

async function calculateProfilePower(destinyData) {
  const profilePower = await manifest.getMaxPowerItems(destinyData);
  const weaponSum = profilePower.weapons.reduce((sum, elem) => { return sum + elem }, 0);

  return {
    warlockPower: Math.floor((profilePower.warlock.reduce((sum, elem) => { return sum + elem }, 0) + weaponSum) / 8),
    titanPower: Math.floor((profilePower.titan.reduce((sum, elem) => { return sum + elem }, 0) + weaponSum) / 8),
    hunterPower: Math.floor((profilePower.hunter.reduce((sum, elem) => { return sum + elem }, 0) + weaponSum) / 8)
  }
}

function parsePower(profilePower) {
  const POWER_REQ = 950;

  const powerObjective = {
    hint: 'Power',
    isComplete: Object.values(profilePower).some(power => power >= POWER_REQ),
    curValue: Math.max.apply(Math, Object.values(profilePower)),
    reqValue: POWER_REQ
  };

  const maxedTriumphs = [
    {
      name: 'Power',
      description: `Achieve a gear Light Level of ${POWER_REQ}`,
      icon: 'https://www.bungie.net/common/destiny2_content/icons/d3b2afca86d26c707c91f72bc910a938.png',
      isComplete: powerObjective.isComplete,
      objectives: [
        powerObjective
      ]
    }
  ];

  const warlockObjective = {
    hint: 'Power',
    isComplete: profilePower.warlockPower >= POWER_REQ,
    curValue: profilePower.warlockPower,
    reqValue: POWER_REQ
  };

  const titanObjective = {
    hint: 'Power',
    isComplete: profilePower.titanPower >= POWER_REQ,
    curValue: profilePower.titanPower,
    reqValue: POWER_REQ
  };

  const hunterObjective = {
    hint: 'Power',
    isComplete: profilePower.hunterPower >= POWER_REQ,
    curValue: profilePower.hunterPower,
    reqValue: POWER_REQ
  };

  const ascendantTriumphs = [
    {
      name: 'Power',
      description: `Achieve a gear Light Level of ${POWER_REQ} on a Warlock`,
      icon: 'https://www.bungie.net/common/destiny2_content/icons/08abe62a2664be8c3239e23a80dfea9d.png',
      isComplete: warlockObjective.isComplete,
      objectives: [
        warlockObjective
      ]
    },
    {
      name: 'Power',
      description: `Achieve a gear Light Level of ${POWER_REQ} on a Titan`,
      icon: 'https://www.bungie.net/common/destiny2_content/icons/e78f012b19b5f6c6026c12547895b756.png',
      isComplete: titanObjective.isComplete,
      objectives: [
        titanObjective
      ]
    },
    {
      name: 'Power',
      description: `Achieve a gear Light Level of ${POWER_REQ} on a Hunter`,
      icon: 'https://www.bungie.net/common/destiny2_content/icons/bfe570eef316e3893589a152af716479.png',
      isComplete: hunterObjective.isComplete,
      objectives: [
        hunterObjective
      ]
    }
  ];

  return [
    {
      name: 'Maxed',
      color: '#67B71F',
      isRedeemable: maxedTriumphs.every((triumph) => triumph.isComplete == true),
      triumphs: maxedTriumphs
    },
    {
      name: 'Ascendant',
      color: '#85FF10',
      isRedeemable: ascendantTriumphs.every((triumph) => triumph.isComplete == true),
      triumphs: ascendantTriumphs
    }
  ]
}

function parseTriumphs(destinyData) {
  const TRIUMPH_POINTS_REQ = 95000;
  const scoreObjective = {
    hint: 'Score',
    isComplete: destinyData.profileRecords.data.score >= TRIUMPH_POINTS_REQ,
    curValue: destinyData.profileRecords.data.score,
    reqValue: TRIUMPH_POINTS_REQ
  };

  const triumphs = [
    {
      name: 'Triumh Points',
      description: 'Earn points by completing triumphs',
      icon: 'https://www.bungie.net/common/destiny2_content/icons/3b023bac8a0959be3c0791ecbcf3c5ec.png',
      isComplete: scoreObjective.isComplete,
      objectives: [
        scoreObjective
      ]
    }
  ];

  return {
    name: 'Triumphant',
    color: '#4947BE',
    isRedeemable: triumphs.every((triumph) => triumph.isComplete == true),
    triumphs: triumphs
  }
}

function parseSeals(destinyData) {
  const sealsIds = [
    2209950401, // Harbinger
    4097789885, // Enlightened
    3303651244, // Undying
  ];

  let sealsCompleted = 0;
  sealsIds.forEach(sealId => {
    const sealNode = destinyData.profilePresentationNodes.data.nodes[sealId];
    if (sealNode) {
      if (sealNode.progressValue >= sealNode.completionValue)
        sealsCompleted++;
    }
  });

  const SEALS_REQ = 2;
  const sealObjective = {
    hint: 'Titles unlocked',
    isComplete: sealsCompleted >= SEALS_REQ,
    curValue: sealsCompleted,
    reqValue: SEALS_REQ
  };

  const triumphs = [
    {
      name: 'Titles',
      description: 'Earn Year 3 Titles',
      icon: 'https://www.bungie.net/common/destiny2_content/icons/23599621d4c63076c647384028d96ca4.png',
      isComplete: sealObjective.isComplete,
      objectives: [
        sealObjective
      ]
    }
  ];

  return {
    name: 'Entitled',
    color: '#8659B6',
    isRedeemable: triumphs.every((triumph) => triumph.isComplete == true),
    triumphs: triumphs
  }
}

function parseRaid(destinyData) {

  const OLD_RAID_COMPLETIONS_REQ = 20;
  const NEW_RAID_COMPLETIONS_REQ = 10;

  // Last Wish
  const lwCompleteObjective = {
    hint: 'Raid Completed',
    isComplete: destinyData.profileRecords.data.records[2195455623].objectives[0].progress >= OLD_RAID_COMPLETIONS_REQ,
    curValue: destinyData.profileRecords.data.records[2195455623].objectives[0].progress,
    reqValue: OLD_RAID_COMPLETIONS_REQ
  };

  // Scourge of the Past
  const sotpCompleteObjective = {
    hint: 'Raid Completed',
    isComplete: destinyData.profileRecords.data.records[4060320345].objectives[0].progress >= OLD_RAID_COMPLETIONS_REQ,
    curValue: destinyData.profileRecords.data.records[4060320345].objectives[0].progress,
    reqValue: OLD_RAID_COMPLETIONS_REQ
  };

  // Crown of Sorrows
  const cosCompleteObjective = {
    hint: 'Raid Completed',
    isComplete: destinyData.profileRecords.data.records[1558682421].objectives[0].progress >= OLD_RAID_COMPLETIONS_REQ,
    curValue: destinyData.profileRecords.data.records[1558682421].objectives[0].progress,
    reqValue: OLD_RAID_COMPLETIONS_REQ
  };

  // Garden of Salvation
  const gosCompleteObjective = {
    hint: 'Raid Completed',
    isComplete: destinyData.profileRecords.data.records[1120290476].objectives[0].progress >= NEW_RAID_COMPLETIONS_REQ,
    curValue: destinyData.profileRecords.data.records[1120290476].objectives[0].progress,
    reqValue: NEW_RAID_COMPLETIONS_REQ
  };

  const triumphs = [
    {
      name: 'Garden of Salvation',
      description: `Complete the raid ${NEW_RAID_COMPLETIONS_REQ} time`,
      icon: 'https://www.bungie.net/common/destiny2_content/icons/6c13fd357e95348a3ab1892fc22ba3ac.png',
      isComplete: gosCompleteObjective.isComplete,
      objectives: [
        gosCompleteObjective
      ]
    },
    {
      name: 'Last Wish',
      description: `Complete the raid ${OLD_RAID_COMPLETIONS_REQ} time`,
      icon: 'https://www.bungie.net/common/destiny2_content/icons/fc5791eb2406bf5e6b361f3d16596693.png',
      isComplete: lwCompleteObjective.isComplete,
      objectives: [
        lwCompleteObjective
      ]
    },
    {
      name: 'Scourge of the Past',
      description: `Complete the raid ${OLD_RAID_COMPLETIONS_REQ} time`,
      icon: 'https://www.bungie.net/common/destiny2_content/icons/8b1bfd1c1ce1cab51d23c78235a6e067.png',
      isComplete: sotpCompleteObjective.isComplete,
      objectives: [
        sotpCompleteObjective
      ]
    },
    {
      name: 'Crown of Sorrows',
      description: `Complete the raid ${OLD_RAID_COMPLETIONS_REQ} time`,
      icon: 'https://www.bungie.net/common/destiny2_content/icons/decaf52ed74c6e66ae363fea24af2ba2.png',
      isComplete: cosCompleteObjective.isComplete,
      objectives: [
        cosCompleteObjective
      ]
    },
  ];

  return {
    name: 'Chosen',
    color: '#AB7C1A',
    isRedeemable: triumphs.every((triumph) => triumph.isComplete == true),
    triumphs: triumphs
  }
}

function parseCrucible(destinyData) {
  const crucibleId = 3882308435;
  const charId = destinyData.profile.data.characterIds[0];
  const seasonResetCount = destinyData.characterProgressions.data[charId].progressions[crucibleId].currentResetCount;

  const RESETS_REQ = 5;
  const resetObjective = {
    hint: 'Resets',
    isComplete: seasonResetCount >= RESETS_REQ,
    curValue: seasonResetCount,
    reqValue: RESETS_REQ
  }

  const pursuitObjective = {
    hint: 'Pursuit completed',
    isComplete: isCollectibleAquired(destinyData, 1539334774),
    curValue: isCollectibleAquired(destinyData, 1539334774) ? 1 : 0,
    reqValue: 1
  }

  const ritualsObjective = {
    hint: 'Triumph completed',
    isComplete: destinyData.profileRecords.data.records[2737832720].state & RecordStatus.COMPLETED,
    curValue: destinyData.profileRecords.data.records[2737832720].state & RecordStatus.COMPLETED ? 1 : 0,
    reqValue: 1
  }

  const ritualWeaponIds = [
    1303705556, // Randy's Throwing Knife
  ];

  let ritualWeaponAquired = 0;
  ritualWeaponIds.forEach(collectibleId => {
    if (isCollectibleAquired(destinyData, collectibleId))
      ritualWeaponAquired++;
  });

  const RITUAL_WEAPONS_REQ = 1;
  const collectionObjective = {
    hint: '',
    isComplete: ritualWeaponAquired >= RITUAL_WEAPONS_REQ,
    curValue: ritualWeaponAquired,
    reqValue: RITUAL_WEAPONS_REQ,
    collectionProgress: [
      {
        icon: 'https://www.bungie.net/common/destiny2_content/icons/a9703364b9d49635eb08cc75d5cd8277.jpg',
        isAquired: isCollectibleAquired(destinyData, 1303705556)
      },
    ]
  };

  const triumphs = [
    {
      name: 'Valor Rank',
      description: 'Reset your Valor Rank 3 times in the active season',
      icon: 'https://www.bungie.net/common/destiny2_content/icons/cc8e6eea2300a1e27832d52e9453a227.png',
      isComplete: resetObjective.isComplete,
      objectives: [
        resetObjective
      ]
    },
    {
      name: 'Pursuit',
      description: 'Complete the Season 8: Battle Drills pursuit and the Season 8: Challenges triumph',
      icon: 'https://www.bungie.net/common/destiny2_content/icons/cc8e6eea2300a1e27832d52e9453a227.png',
      isComplete: pursuitObjective.isComplete && ritualsObjective.isComplete,
      objectives: [
        pursuitObjective,
        ritualsObjective
      ]
    },
    {
      name: 'Ritual Weapons',
      description: 'Aquire weapons',
      icon: 'https://www.bungie.net/common/destiny2_content/icons/2565ae54801563abfefd78f8c2dd6463.png',
      isComplete: collectionObjective.isComplete,
      objectives: [
        collectionObjective
      ]
    },
  ];

  return {
    name: "Shaxx's Favourite",
    color: '#9F4436',
    isRedeemable: triumphs.every((triumph) => triumph.isComplete == true),
    triumphs: triumphs
  }
}

function parseGambit(destinyData) {
  const gambitId = 2772425241;
  const charId = destinyData.profile.data.characterIds[0];
  const seasonResetCount = destinyData.characterProgressions.data[charId].progressions[gambitId].currentResetCount;

  const RESETS_REQ = 1;
  const resetObjective = {
    hint: 'Resets',
    isComplete: seasonResetCount >= RESETS_REQ,
    curValue: seasonResetCount,
    reqValue: RESETS_REQ
  };

  const pursuitObjective = {
    hint: 'Pursuit completed',
    isComplete: isCollectibleAquired(destinyData, 971966216),
    curValue: isCollectibleAquired(destinyData, 971966216) ? 1 : 0,
    reqValue: 1
  }

  const ritualsObjective = {
    hint: 'Triumph completed',
    isComplete: destinyData.profileRecords.data.records[3388126667].state & RecordStatus.COMPLETED,
    curValue: destinyData.profileRecords.data.records[3388126667].state & RecordStatus.COMPLETED ? 1 : 0,
    reqValue: 1
  }

  const ritualWeaponIds = [
    1510655351, // Exit Strategy
  ];

  let ritualWeaponAquired = 0;
  ritualWeaponIds.forEach(collectibleId => {
    if (isCollectibleAquired(destinyData, collectibleId))
      ritualWeaponAquired++;
  });

  const RITUAL_WEAPONS_REQ = 1;
  const collectionObjective = {
    hint: '',
    isComplete: ritualWeaponAquired >= RITUAL_WEAPONS_REQ,
    curValue: ritualWeaponAquired,
    reqValue: RITUAL_WEAPONS_REQ,
    collectionProgress: [
      {
        icon: 'https://www.bungie.net/common/destiny2_content/icons/b7965908f517f6dfd59bf173cad3afd1.jpg',
        isAquired: isCollectibleAquired(destinyData, 1510655351)
      },
    ]
  };

  const triumphs = [
    {
      name: 'Infamy Rank',
      description: 'Reset your Infamy Rank in the active season',
      icon: 'https://www.bungie.net/common/destiny2_content/icons/fc31e8ede7cc15908d6e2dfac25d78ff.png',
      isComplete: resetObjective.isComplete,
      objectives: [
        resetObjective
      ]
    },
    {
      name: 'Pursuit',
      description: 'Complete the Season 8: Keepin On pursuit and the Season 8: Rituals triumph',
      icon: 'https://www.bungie.net/common/destiny2_content/icons/fc31e8ede7cc15908d6e2dfac25d78ff.png',
      isComplete: pursuitObjective.isComplete && ritualsObjective.isComplete,
      objectives: [
        pursuitObjective,
        ritualsObjective
      ]
    },
    {
      name: 'Ritual Weapons',
      description: 'Aquire weapons',
      icon: 'https://www.bungie.net/common/destiny2_content/icons/2565ae54801563abfefd78f8c2dd6463.png',
      isComplete: collectionObjective.isComplete,
      objectives: [
        collectionObjective
      ]
    }
  ];

  return {
    name: 'Notorious',
    color: '#1A8B12',
    isRedeemable: triumphs.every((triumph) => triumph.isComplete == true),
    triumphs: triumphs
  }
}

function parseVanguard(destinyData) {
  const nfId = 689153319;
  const charId = destinyData.profile.data.characterIds[0];
  const nfRank = destinyData.characterProgressions.data[charId].progressions[nfId].level;

  const rankObjective = {
    hint: 'Rank',
    isComplete: nfRank >= 20,
    curValue: nfRank,
    reqValue: 20
  };

  const masterNFObjective = {
    hint: 'Master NF completed',
    isComplete: destinyData.profileRecords.data.records[3495463203].state & RecordStatus.COMPLETED,
    curValue: destinyData.profileRecords.data.records[3495463203].state & RecordStatus.COMPLETED ? 1 : 0,
    reqValue: 1
  }

  const pursuitObjective = {
    hint: 'Pursuit completed',
    isComplete: isCollectibleAquired(destinyData, 1904194019),
    curValue: isCollectibleAquired(destinyData, 1904194019) ? 1 : 0,
    reqValue: 1
  }

  const ritualWeaponIds = [
    853534062, // Edgewise
  ];

  let ritualWeaponAquired = 0;
  ritualWeaponIds.forEach(collectibleId => {
    if (isCollectibleAquired(destinyData, collectibleId))
      ritualWeaponAquired++;
  });

  const RITUAL_WEAPONS_REQ = 1;
  const collectionObjective = {
    hint: '',
    isComplete: ritualWeaponAquired >= RITUAL_WEAPONS_REQ,
    curValue: ritualWeaponAquired,
    reqValue: RITUAL_WEAPONS_REQ,
    collectionProgress: [
      {
        icon: 'https://www.bungie.net/common/destiny2_content/icons/5bab29043c0a33f1d047377052be5f30.jpg',
        isAquired: isCollectibleAquired(destinyData, 853534062)
      },
    ]
  };

  const triumphs = [
    {
      name: 'Nightfalls',
      description: 'Achieve a high Nightfall rank and complete Nightfall: The Ordeal on Master difficulty',
      icon: 'https://www.bungie.net/common/destiny2_content/icons/1538509805dda202c0d14771fe4f6d20.png',
      isComplete: rankObjective.isComplete,
      objectives: [
        rankObjective,
        masterNFObjective
      ]
    },
    {
      name: 'Pursuit',
      description: 'Complete the Season 8: First Watch pursuit',
      icon: 'https://www.bungie.net/common/destiny2_content/icons/1538509805dda202c0d14771fe4f6d20.png',
      isComplete: pursuitObjective.isComplete,
      objectives: [
        pursuitObjective
      ]
    },
    {
      name: 'Ritual Weapons',
      description: 'Aquire weapons',
      icon: 'https://www.bungie.net/common/destiny2_content/icons/2565ae54801563abfefd78f8c2dd6463.png',
      isComplete: collectionObjective.isComplete,
      objectives: [
        collectionObjective
      ]
    },
  ];

  return {
    name: 'Vanguardian',
    color: '#396189',
    isRedeemable: triumphs.every((triumph) => triumph.isComplete == true),
    triumphs: triumphs
  }
}
